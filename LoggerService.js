const fs = require('fs');
const path = require('path');
const CONFIG = require('./config');

class LoggerService {
    constructor() {
        // O log ficará salvo dentro da pasta dataset
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
        // Pega a data e hora exata do erro
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const linha = `[${timestamp}] [${nivel}] ${mensagem}\n`;
        
        try {
            fs.appendFileSync(this.caminhoLog, linha);
        } catch (error) {
            console.error("Falha catastrófica ao escrever no log: ", error);
        }
    }

    info(msg) { this.escrever('INFO', msg); }
    erro(msg) { this.escrever('ERRO', msg); }
    aviso(msg) { this.escrever('AVISO', msg); }
}

module.exports = LoggerService;