import WebSocket from "ws";

export function wsInit() {
  const websocket = new WebSocket("ws://localhost:4221", "protocol1");

  websocket.on("open", () => {
    console.log("Connected to WebSocket server!");
  });

  websocket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  websocket.on("message", (data) => {
    console.log("Message from server:", data.toString());
  });

  return websocket;
}
