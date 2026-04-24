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
        if (!fs.existsSync(CONFIG.SISTEMA.PASTA_DATASET)) {
            fs.mkdirSync(CONFIG.SISTEMA.PASTA_DATASET, { recursive: true });
        }
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

    // --- NOVO: FILTRO E VALIDAÇÃO MATEMÁTICA ---
    validarEFiltrar(categoria) {
        let picoMaximo = 0;

        for (let i = 0; i < this.buffer.length; i++) {
            let amostra = this.buffer[i];
            
            // 1. Aplica o Noise Gate (Zera ruídos elétricos de fundo)
            if (Math.abs(amostra) < CONFIG.AUDIO.NOISE_GATE_THRESHOLD) {
                this.buffer[i] = 0;
            }

            // 2. Procura o maior pico de áudio da gravação inteira
            if (Math.abs(this.buffer[i]) > picoMaximo) {
                picoMaximo = Math.abs(this.buffer[i]);
            }
        }

        // 3. Validação: Se a pessoa tentou gravar um "acerto" ou "tiro", mas o som foi muito baixo, recusa.
        // (Não aplicamos isso ao "ruido" porque o ruído de ambiente é naturalmente baixo)
        if (categoria !== 'ruido' && picoMaximo < CONFIG.AUDIO.IMPACTO_MINIMO_THRESHOLD) {
            throw new Error(`Áudio recusado. Pico máximo (${picoMaximo}) foi muito fraco. O alvo não foi atingido ou o microfone falhou.`);
        }
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
                // Roda o filtro antes de salvar!
                this.validarEFiltrar(categoria);

                const caminho = this.gerarNomeArquivo(categoria);
                const wav = new WaveFile();
                
                wav.fromScratch(
                    CONFIG.AUDIO.CANAIS, 
                    CONFIG.AUDIO.TAXA_AMOSTRAGEM, 
                    CONFIG.AUDIO.BIT_DEPTH, 
                    this.buffer
                );
                
                fs.writeFileSync(caminho, wav.toBuffer());
                this.amostrasLidas = 0; 
                resolve({ caminho: caminho, buffer: wav.toBuffer() });
            } catch (error) {
                this.amostrasLidas = 0; // Reseta mesmo dando erro para não travar
                reject(error);
            }
        });
    }

    getProgresso() {
        return (this.amostrasLidas / CONFIG.AUDIO.TOTAL_AMOSTRAS) * 100;
    }
}

module.exports = AudioService;