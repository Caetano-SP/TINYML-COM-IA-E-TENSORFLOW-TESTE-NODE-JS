const fs = require('fs');
const path = require('path');
const CONFIG = require('./config');

class LoggerService {
    constructor() {
        this.caminhoLog = path.join(CONFIG.SISTEMA.PASTA_DATASET, 'storm_erros.log');
        this.iniciarLog();
    }

    iniciarLog() {
        if (!fs.existsSync(CONFIG.SISTEMA.PASTA_DATASET)) {
            fs.mkdirSync(CONFIG.SISTEMA.PASTA_DATASET, { recursive: true });
        }
        this.escrever('SISTEMA', 'Inicialização do Logger');
    }

    escrever(nivel, mensagem) {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const linha = `[${timestamp}] [${nivel}] ${mensagem}\n`;
        try { fs.appendFileSync(this.caminhoLog, linha); } catch (error) {}
    }

    info(msg) { this.escrever('INFO', msg); }
    erro(msg) { this.escrever('ERRO', msg); }
    aviso(msg) { this.escrever('AVISO', msg); }
}

module.exports = LoggerService;