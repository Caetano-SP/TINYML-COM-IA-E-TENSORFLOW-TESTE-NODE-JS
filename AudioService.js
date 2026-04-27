const fs = require('fs');
const path = require('path');
const { WaveFile } = require('wavefile');
const CONFIG = require('./config');

class AudioService {
    constructor() {
        this.buffer = new Int16Array(CONFIG.AUDIO.TOTAL_AMOSTRAS);
        this.amostrasLidas = 0;
        this.garantirEstruturaDePastas();
    }

    garantirEstruturaDePastas() {
        if (!fs.existsSync(CONFIG.SISTEMA.PASTA_DATASET)) fs.mkdirSync(CONFIG.SISTEMA.PASTA_DATASET, { recursive: true });
        CONFIG.SISTEMA.CATEGORIAS.forEach(categoria => {
            const caminho = path.join(CONFIG.SISTEMA.PASTA_DATASET, categoria);
            if (!fs.existsSync(caminho)) fs.mkdirSync(caminho, { recursive: true });
        });
    }

    adicionarAmostra(valor) {
        if (this.amostrasLidas >= CONFIG.AUDIO.TOTAL_AMOSTRAS) return false;
        this.buffer[this.amostrasLidas] = Math.max(-32768, Math.min(32767, valor));
        this.amostrasLidas++;
        return this.amostrasLidas === CONFIG.AUDIO.TOTAL_AMOSTRAS; 
    }

    validarEFiltrar(categoria) {
        let picoMaximo = 0;
        for (let i = 0; i < this.buffer.length; i++) {
            if (Math.abs(this.buffer[i]) < CONFIG.AUDIO.NOISE_GATE_THRESHOLD) this.buffer[i] = 0;
            if (Math.abs(this.buffer[i]) > picoMaximo) picoMaximo = Math.abs(this.buffer[i]);
        }
        if (categoria !== 'ruido' && picoMaximo < CONFIG.AUDIO.IMPACTO_MINIMO_THRESHOLD) {
            throw new Error(`Áudio recusado. Pico máximo (${picoMaximo}) foi muito fraco.`);
        }
    }

    recortarAudio() {
        let picoMaximo = 0;
        let indiceDoPico = 0;

        for (let i = 0; i < this.buffer.length; i++) {
            if (Math.abs(this.buffer[i]) > picoMaximo) {
                picoMaximo = Math.abs(this.buffer[i]);
                indiceDoPico = i;
            }
        }

        const amostrasAntes = 1600; // 100ms
        const amostrasDepois = 6400; // 400ms

        let inicio = Math.max(0, indiceDoPico - amostrasAntes);
        let fim = Math.min(this.buffer.length, indiceDoPico + amostrasDepois);

        return this.buffer.slice(inicio, fim);
    }

    gerarNomeArquivo(categoria) {
        const pasta = path.join(CONFIG.SISTEMA.PASTA_DATASET, categoria);
        const arquivos = fs.readdirSync(pasta);
        const proximoNumero = String(arquivos.length + 1).padStart(3, '0'); 
        return path.join(pasta, `${categoria}_${proximoNumero}.wav`);
    }

    salvarWav(categoria) {
        return new Promise((resolve, reject) => {
            try {
                this.validarEFiltrar(categoria);
                const bufferCirurgico = this.recortarAudio();
                const caminho = this.gerarNomeArquivo(categoria);
                const wav = new WaveFile();
                
                wav.fromScratch(CONFIG.AUDIO.CANAIS, CONFIG.AUDIO.TAXA_AMOSTRAGEM, CONFIG.AUDIO.BIT_DEPTH, bufferCirurgico);
                fs.writeFileSync(caminho, wav.toBuffer());
                
                this.amostrasLidas = 0; 
                resolve({ caminho: caminho, buffer: wav.toBuffer() });
            } catch (error) {
                this.amostrasLidas = 0; 
                reject(error);
            }
        });
    }
}

module.exports = AudioService;