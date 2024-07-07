const { SerialPort } = require('serialport');

// Define GPIO pin variables
const RS485_B_PIN = '1';  // GPIO pin connected to RS485 B line
const GND_PIN = '2';      // GPIO pin connected to GND
const RS485_A_PIN = '3';  // GPIO pin connected to RS485 A line

// Function to open the serial port
async function openSerialPort() {
    return new Promise((resolve, reject) => {
        const port = new SerialPort({
            path: 'COM12',  // Adjust the COM port as necessary
            baudRate: 19200,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
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

// Function to set a GPIO pin high
function setPinHigh(port, pin) {
    port.write(`gpio set 00${pin}\n`, (err) => {
        if (err) {
            console.log('Error writing to port: ' + err.message);
        }
    });
}

// Function to set a GPIO pin low
function setPinLow(port, pin) {
    port.write(`gpio clear 00${pin}\n`, (err) => {
        if (err) {
            console.log('Error writing to port: ' + err.message);
        }
    });
}

// Function to send RS485 command
function sendRS485Command(port, command) {
    for (let i = 0; i < command.length; i++) {
        let bit = command.charCodeAt(i).toString(2).padStart(8, '0');
        for (let j = 0; j < bit.length; j++) {
            if (bit[j] === '1') {
                setPinHigh(port, RS485_A_PIN); // RS485 A line
                setPinLow(port, RS485_B_PIN);  // RS485 B line
            } else {
                setPinLow(port, RS485_A_PIN);  // RS485 A line
                setPinHigh(port, RS485_B_PIN); // RS485 B line
            }
            // Wait for a bit period
            // Adjust the delay based on your baud rate
            sleep(1); // 1 ms sleep for example
        }
    }
}

// Function to sleep for a given number of milliseconds
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function to handle the port opening and RS485 communication
async function main() {
    try {
        const port = await openSerialPort();

        // Send an RS485 command example
        // Replace 'YOUR_RS485_COMMAND' with the actual command for your motor controller
        const rs485Command = 'YOUR_RS485_COMMAND';
        sendRS485Command(port, rs485Command);

        // Clean up on exit
        process.on('SIGINT', () => {
            setPinLow(port, RS485_B_PIN);
            setPinLow(port, RS485_A_PIN);
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
