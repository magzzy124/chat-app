import WebSocket from "ws";
let webSocket = new WebSocket("ws://127.0.0.1:4221", "protocol1");
// let webSocket = new WebSocket("wss://echo.websocket.org");

// Kada se veza uspostavi, obraditi događaj
webSocket.onopen = function (event) {
  console.log("WebSocket connection opened.");
  console.log("WebSocket object:", webSocket);
  let message = "3: " + "pero" + "\n";
  webSocket.send(message);
  // Ako želite da ispišete dodatne informacije, možete koristiti webSocket objekat
  // Npr., webSocket.readyState daje stanje veze
  console.log("WebSocket readyState:", webSocket.readyState);
};

// Kada se primi poruka, obraditi događaj
webSocket.onmessage = function (event) {
  console.log("Message received from server:", event.data);
};

// Kada se veza zatvori, obraditi događaj
webSocket.onclose = function (event) {
  console.log("WebSocket connection closed.");
};

// Kada dođe do greške, obraditi događaj
webSocket.onerror = function (event) {
  console.error("WebSocket error:", event);
};
