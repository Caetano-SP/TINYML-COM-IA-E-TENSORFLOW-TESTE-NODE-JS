const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

class WebServer {
    constructor(orquestrador) {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server);
        this.orquestrador = orquestrador;

        this.configurarRotas();
        this.configurarSockets();
    }

    configurarRotas() {
        this.app.use(express.static(path.join(__dirname, '..', 'public')));
    }

    configurarSockets() {
        this.io.on('connection', (socket) => {
            socket.on('comando_gravar', () => {
                const hardwarePronto = this.orquestrador.iniciarCaptura();
                if (!hardwarePronto) {
                    socket.emit('erro_hardware', "Hardware ESP32 desconectado! Verifique o cabo USB.");
                } else {
                    socket.emit('gravacao_iniciada');
                }
            });

            socket.on('comando_salvar', (categoria) => {
                this.orquestrador.finalizarE_Salvar(categoria);
            });

            socket.on('comando_descartar', () => {
                this.orquestrador.descartarAudio();
            });
        });
    }

    enviarWaveform(bufferRecortado) {
        const dadosGrafico = Array.from(bufferRecortado);
        this.io.emit('waveform_pronto', dadosGrafico);
    }

    iniciar(porta = 3000) {
        this.server.listen(porta, () => {
            console.log(`\n🚀 STORM X PRO Dashboard online!`);
            console.log(`👉 Abra o navegador e acesse: http://localhost:${porta}\n`);
        });
    }
}

module.exports = WebServer;