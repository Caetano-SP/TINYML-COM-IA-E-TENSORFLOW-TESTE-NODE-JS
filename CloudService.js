const CONFIG = require('./config');

class CloudService {
    constructor(logger) {
        this.logger = logger;
    }

    async enviar(bufferWav, nomeArquivo, categoria) {
        if (!CONFIG.NUVEM.API_KEY || CONFIG.NUVEM.API_KEY === 'COLE_SUA_API_KEY_AQUI') {
            throw new Error("NUVEM DESLIGADA: API Key não configurada. Salvo apenas localmente.");
        }

        try {
            const resposta = await fetch(CONFIG.NUVEM.ENDPOINT, {
                method: 'POST',
                headers: {
                    'x-api-key': CONFIG.NUVEM.API_KEY,
                    'x-file-name': nomeArquivo,
                    'x-label': categoria,
                    'Content-Type': 'audio/wav'
                },
                body: bufferWav
            });

            if (!resposta.ok) {
                const erroApi = await resposta.text();
                throw new Error(`Recusado pelo servidor: ${erroApi}`);
            }
            return true;
        } catch (error) {
            this.logger.erro(`Falha upload nuvem: ${error.message}`);
            throw error; 
        }
    }
}

module.exports = CloudService;