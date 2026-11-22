import app from "./src/app";
import http from 'http';
import { WebSocketServer } from 'ws';
import prisma from './src/lib/prisma';

const server = http.createServer(app)
const wsServer = new WebSocketServer({ server })
const PORT = process.env.PORT || 5000;

wsServer.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);
        ws.send(`Message received successfully: ${message}`);
    });
});

server.listen(PORT, async () => {
    console.log(`Server started on port ${PORT}`);
    try {
        await prisma.$connect();
        console.log('Successfully connected to MySQL database via Prisma');
    } catch (error) {
        console.warn('Database connection warning (ensure MySQL is running and DATABASE_URL is set):', (error as Error).message);
    }
});

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
