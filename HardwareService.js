const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const EventEmitter = require('events');
const CONFIG = require('./config');

class HardwareService extends EventEmitter {
    constructor() {
        super();
        this.porta = null;
        this.parser = null;
        this.conectado = false;
    }

    conectar() {
        try {
            this.porta = new SerialPort({ path: CONFIG.HARDWARE.PORTA, baudRate: CONFIG.HARDWARE.BAUD_RATE });
            this.parser = this.porta.pipe(new ReadlineParser({ delimiter: CONFIG.HARDWARE.DELIMITER }));

            this.porta.on('open', () => {
                this.conectado = true;
                this.emit('conectado', CONFIG.HARDWARE.PORTA);
            });

            this.porta.on('error', (err) => {
                this.conectado = false;
                this.emit('erro', err.message);
            });

            this.porta.on('close', () => {
                this.conectado = false;
                this.emit('desconectado');
            });

            this.parser.on('data', (linha) => {
                const valor = parseInt(linha.trim(), 10);
                if (!isNaN(valor)) this.emit('dado', valor);
            });
        } catch (error) {
            this.emit('erro', error.message);
        }
    }
}

module.exports = HardwareService;