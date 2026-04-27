const HardwareService = require('./src/HardwareService');
const AudioService = require('./src/AudioService');
const LoggerService = require('./src/LoggerService');
const CloudService = require('./src/CloudService');
const WebServer = require('./src/WebServer');

class AppOrquestrador {
    constructor() {
        this.hardware = new HardwareService();
        this.audio = new AudioService();
        this.logger = new LoggerService();
        this.cloud = new CloudService(this.logger);
        this.web = new WebServer(this); 
        this.gravando = false;
        this.configurarEventos();
    }

    iniciar() {
        this.web.iniciar(); 
        this.hardware.conectar(); 
    }

    configurarEventos() {
        this.hardware.on('conectado', (porta) => {
            console.log(`\n✅ [ STATUS ]: Hardware conectado na ${porta}.`);
            console.log(`🎯 Tudo pronto! Acesse o navegador.\n`);
        });

        this.hardware.on('erro', (msg) => {
            console.log(`\n❌ [ ALERTA ]: ESP32 não encontrado. Motivo: ${msg}`);
            console.log(`🔌 Conecte o cabo USB e reinicie o painel.\n`);
        });

        this.hardware.on('dado', (valor) => {
            if (!this.gravando) return;
            const finalizou = this.audio.adicionarAmostra(valor);
            
            if (finalizou) {
                this.gravando = false;
                const bufferCirurgico = this.audio.recortarAudio();
                this.web.enviarWaveform(bufferCirurgico);
            }
        });
    }

    iniciarCaptura() {
        if (!this.hardware.conectado) {
            this.logger.aviso("Tentativa de gravação bloqueada: ESP32 desconectado.");
            return false; 
        }
        this.audio.amostrasLidas = 0; 
        this.gravando = true;
        return true; 
    }

    async finalizarE_Salvar(categoria) {
        try {
            const { caminho, buffer } = await this.audio.salvarWav(categoria);
            const nomeArquivo = caminho.split(/[\\/]/).pop();
            await this.cloud.enviar(buffer, nomeArquivo, categoria);
            this.logger.info(`Salvo e na Nuvem: ${nomeArquivo}`);
            console.log(`[ INFO ] Salvo: ${nomeArquivo}`);
        } catch (error) {
            this.logger.erro(`Erro ao salvar: ${error.message}`);
            console.log(`[ ERRO ] ${error.message}`);
        }
    }

    descartarAudio() {
        this.audio.amostrasLidas = 0;
        this.logger.info("Áudio descartado pelo usuário.");
    }
}

const app = new AppOrquestrador();
app.iniciar();