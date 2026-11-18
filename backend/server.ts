import app from "./src/app";
import http from 'http';
import { WebSocketServer } from 'ws';

const server = http.createServer(app)
const wsServer = new WebSocketServer({ server })
const PORT = 5000;

wsServer.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);
        ws.send(`Message received successfully: ${message}`);
    });
});

server.listen(PORT, ()=>{
    console.log(`Server started ${PORT}`);
})
