import WebSocket from "ws";

export function initializeWs() {
  let websocket = null;
  let reconnectAttempts = 0;
  const maxReconnectDelay = 10000;

  const connect = () => {
    websocket = new WebSocket("ws://127.0.0.1:4221", "protocol1");

    websocket.onopen = () => {
      console.log("Websocket successfully opened!");
      reconnectAttempts = 0;
    };

    websocket.onerror = (error) => {
      console.error("Websocket error:", error);
    };

    websocket.onclose = () => {
      console.log("Websocket closed. Attempting to reconnect...");
      scheduleReconnect();
    };
  };

  const scheduleReconnect = () => {
    reconnectAttempts++;
    const delay = Math.min(1000 * reconnectAttempts, maxReconnectDelay);
    setTimeout(connect, delay);
  };

  connect();

  return websocket;
}
