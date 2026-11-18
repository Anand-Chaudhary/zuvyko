import { wsInstance } from './axiosInstance';

const wsConnect = () => {
    wsInstance.onopen = () => {
        console.log('WebSocket connection established');
        wsInstance.send('Hello from the client!');
        wsInstance.onmessage = (event) => {
            console.log(`Received message from server: ${event.data}`);
        }
    }
}

export default wsConnect;