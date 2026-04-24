const HardwareService = require('./src/HardwareService');
const AudioService = require('./src/AudioService');
const TerminalUI = require('./src/TerminalUI');
const LoggerService = require('./src/LoggerService');
const CloudService = require('./src/CloudService'); // 1. IMPORTA A NUVEM

class AppOrquestrador {
    constructor() {
        this.hardware = new HardwareService();
        this.audio = new AudioService();
        this.ui = new TerminalUI();
        this.logger = new LoggerService();
        this.cloud = new CloudService(this.logger); // 2. LIGA A NUVEM
        
        this.estado = { gravando: false, categoriaAtual: null };
        this.configurarEventos();
    }

    iniciar() {
        this.ui.mostrarCabecalho();
        this.hardware.conectar();
    }

    configurarEventos() {
        // Eventos de Hardware
        this.hardware.on('conectado', (porta) => {
            this.ui.logSucesso(`Microfone INMP441 sincronizado na porta ${porta}`);
            this.apresentarMenu();
        });

        this.hardware.on('erro', (msg) => {
            this.ui.logErro(`Falha de Hardware: ${msg}`);
            process.exit(1);
        });

        // Loop de alta performance (Recebimento de Dados)
        this.hardware.on('dado', (valor) => {
            if (!this.estado.gravando) return;

            const finalizou = this.audio.adicionarAmostra(valor);
            
            // Otimiza a renderização da tela para não gastar processamento à toa
            if (this.audio.amostrasLidas % 800 === 0) {
                this.ui.atualizarBarraProgresso(this.audio.getProgresso());
            }

            if (finalizou) {
                this.finalizarGravacao();
            }
        });

        // Intercepta Ctrl+C para desligamento seguro
        process.on('SIGINT', () => this.desligarSeguro());
    }

    apresentarMenu() {
        this.ui.perguntarOpcao((opcao) => {
            const mapas = { '1': 'acerto', '2': 'tiro_erro', '3': 'ruido' };
            
            if (opcao === '0') return this.desligarSeguro();
            
            if (mapas[opcao]) {
                this.estado.categoriaAtual = mapas[opcao];
                this.ui.aguardarAcao(this.estado.categoriaAtual, () => {
                    this.estado.gravando = true;
                });
            } else {
                this.ui.logAviso("Opção inválida.");
                this.apresentarMenu();
            }
        });
    }

    async finalizarGravacao() {
        this.estado.gravando = false;
        console.log(''); 
        
        try {
            // Passo A: Filtra e Salva no Windows
            const { caminho, buffer } = await this.audio.salvarWav(this.estado.categoriaAtual);
            this.ui.logSucesso(`Local: Arquivo salvo em ${caminho}`);
            
            // Passo B: Pega apenas o nome (ex: acerto_001.wav) e envia para a Nuvem
            this.ui.logAviso("Sincronizando com a IA (Edge Impulse)...");
            const nomeArquivo = caminho.split(/[\\/]/).pop();
            
            await this.cloud.enviar(buffer, nomeArquivo, this.estado.categoriaAtual);
            this.ui.logSucesso("Nuvem: Upload concluído! O Edge Impulse já tem esse dado.");
            this.logger.info(`Sincronização Total: ${nomeArquivo}`);

        } catch (error) {
            this.ui.logErro(error.message);
            this.logger.erro(`Falha no ciclo: ${error.message}`);
        }
        
        setTimeout(() => this.apresentarMenu(), 2000);
    }

    desligarSeguro() {
        this.ui.logAviso("\nDesconectando ESP32 com segurança...");
        this.hardware.desconectar();
        process.exit(0);
    }
}

// Inicia o motor
const app = new AppOrquestrador();
app.iniciar();