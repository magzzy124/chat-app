let webSocket = new WebSocket("ws://localhost:4221", "protocol1");

// Kada se veza uspostavi, obraditi događaj
webSocket.onopen = function (event) {
  console.log("WebSocket connection opened.");
  console.log("WebSocket object:", webSocket);
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

window.addEventListener("beforeunload", function () {
  webSocket.close();
});

let inputDiv = document.getElementById("inputDiv");
function sendLogin() {
  let message = "1: " + inputDiv.value;
  webSocket.send(message);
}
function sendMessage() {
  let message = "3: " + inputDiv.value + "\n";
  webSocket.send(message);
}
