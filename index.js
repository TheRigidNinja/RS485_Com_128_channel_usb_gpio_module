const { SerialPort } = require('serialport');
const crc = require('crc'); // Make sure to install this package using npm install crc

// Function to calculate CRC with starting word FFFFH
function calculateCRC(buffer) {
    const crcValue = crc.crc16modbus(buffer);
    return [(crcValue & 0xFF), (crcValue >> 8) & 0xFF]; // Return CRC as [LSB, MSB]
}

// Function to open the serial port
async function openSerialPort() {
    return new Promise((resolve, reject) => {
        const port = new SerialPort({
            path: 'COM4', // Adjust the COM port as necessary
            baudRate: 9600,
            dataBits: 8,
            stopBits: 1,
            parity: 'none'
        });

        port.on('open', () => {
            console.log('Port opened successfully!');
            resolve(port);
        });

        port.on('error', (error) => {
            reject('Failed to open port: ' + error.message);
        });
    });
}

// Function to send Modbus RTU command with CRC
function sendModbusCommand(port, command) {
    // Convert command string to buffer
    const buffer = Buffer.from(command.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    // Calculate CRC and append to command
    const crcValues = calculateCRC(buffer);
    const finalCommand = Buffer.concat([buffer, Buffer.from(crcValues)]);

    console.log('Final command with CRC:', finalCommand.toString('hex'));

    // Write the command to the serial port
    port.write(finalCommand, (err) => {
        if (err) {
            console.error('Error writing to port: ', err.message);
        } else {
            console.log('Command sent:', finalCommand.toString('hex'));
        }
    });

    // Listen for data from the motor controller
    port.on('data', (data) => {
        console.log('Received response:', data.toString('hex'));
    });

    port.on('error', (err) => {
        console.error('Serial port error:', err.message);
    });
}

// Main function to handle the port opening and communication
async function main() {
    try {
        const port = await openSerialPort();

        // Example Modbus RTU command (function code 06 to write a single register)
        // const modbusCommand = '010680000B00'; // Move Forward
        // const modbusCommand = '010680000900'; // Move backward
        const modbusCommand = '010380060001'; // Example command without CRC
        // const modbusCommand = '010680000902';
        // const modbusCommand = "010680000802"; // Natural stop
        // const modbusCommand = "010680000D02"; // Braking stop

        sendModbusCommand(port, modbusCommand);

        // Clean up on exit
        process.on('SIGINT', () => {
            port.close(() => {
                console.log('Port closed');
                process.exit();
            });
        });

    } catch (error) {
        console.error(error);
    }
}

main();
