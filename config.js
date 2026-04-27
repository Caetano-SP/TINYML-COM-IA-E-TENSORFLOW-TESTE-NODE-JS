const path = require('path');

const CONFIG = {
    HARDWARE: {
        PORTA: 'COM14', // Mude se necessário no PC do trabalho
        BAUD_RATE: 460800,
        DELIMITER: '\r\n'
    },
    AUDIO: {
        TAXA_AMOSTRAGEM: 16000,
        SEGUNDOS_GRAVACAO: 2,
        CANAIS: 1,
        BIT_DEPTH: '16',
        NOISE_GATE_THRESHOLD: 150, 
        IMPACTO_MINIMO_THRESHOLD: 4000 
    },
    NUVEM: {
        API_KEY: 'ei_a223079d7b3b7daf9998cf6655f9458aa02af07206f21ca2',
        ENDPOINT: 'https://ingestion.edgeimpulse.com/api/training/data'
    },
    SISTEMA: {
        PASTA_DATASET: path.join(__dirname, '..', 'dataset'),
        CATEGORIAS: ['acerto', 'tiro_erro', 'ruido']
    }
};

CONFIG.AUDIO.TOTAL_AMOSTRAS = CONFIG.AUDIO.TAXA_AMOSTRAGEM * CONFIG.AUDIO.SEGUNDOS_GRAVACAO;

module.exports = CONFIG;