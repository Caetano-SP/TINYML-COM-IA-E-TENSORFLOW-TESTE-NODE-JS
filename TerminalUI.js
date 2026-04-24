const readline = require('readline');

class TerminalUI {
    constructor() {
        this.cli = readline.createInterface({ input: process.stdin, output: process.stdout });
        this.cores = {
            reset: "\x1b[0m", brilho: "\x1b[1m", verde: "\x1b[32m",
            amarelo: "\x1b[33m", vermelho: "\x1b[31m", ciano: "\x1b[36m"
        };
    }

    limparTela() { console.clear(); }

    mostrarCabecalho() {
        this.limparTela();
        console.log(`${this.cores.ciano}${this.cores.brilho}==================================================`);
        console.log("   STORM X PRO - ENTERPRISE DATASET COLLECTOR   ");
        console.log(`==================================================${this.cores.reset}\n`);
    }

    logSucesso(msg) { console.log(`${this.cores.verde}✔ [ OK ] ${msg}${this.cores.reset}`); }
    logErro(msg) { console.error(`${this.cores.vermelho}✖ [ ERRO ] ${msg}${this.cores.reset}`); }
    logAviso(msg) { console.log(`${this.cores.amarelo}⚠ [ AVISO ] ${msg}${this.cores.reset}`); }

    atualizarBarraProgresso(porcentagem) {
        const tamanhoBarra = 30;
        const blocos = Math.round((porcentagem / 100) * tamanhoBarra);
        const barra = '█'.repeat(blocos) + '░'.repeat(tamanhoBarra - blocos);
        process.stdout.write(`\r${this.cores.ciano}Gravando: [${barra}] ${porcentagem.toFixed(0)}%${this.cores.reset}`);
    }

    perguntarOpcao(callback) {
        console.log(`\n${this.cores.brilho}Qual categoria deseja gravar?${this.cores.reset}`);
        console.log(` ${this.cores.verde}1 - Acerto (Impacto no Alvo)${this.cores.reset}`);
        console.log(` ${this.cores.amarelo}2 - Tiro/Erro (Ao lado)${this.cores.reset}`);
        console.log(` ${this.cores.ciano}3 - Ruído de Ambiente${this.cores.reset}`);
        console.log(` ${this.cores.vermelho}0 - Desligar Sistema${this.cores.reset}`);
        
        this.cli.question('\n👉 Opção: ', (resposta) => callback(resposta.trim()));
    }

    aguardarAcao(categoria, callback) {
        console.log(`\n🎯 Modo Armado: ${this.cores.brilho}${categoria.toUpperCase()}${this.cores.reset}`);
        this.cli.question(`Pressione ${this.cores.verde}[ENTER]${this.cores.reset} e execute o disparo...`, () => {
            callback();
        });
    }
}

module.exports = TerminalUI;