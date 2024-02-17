const { invoke } = window.__TAURI__.tauri;

let address;
let port;
let command;
let message;

function logMessage(x) {
  message.textContent = message.textContent + "\n" + x;
}

async function send_command() {
  const fullAddress = address.value + ":" + port.value;
  const result = await invoke("connect_machine", { remote: fullAddress, command: command.value });
  logMessage(result);
}

window.addEventListener("DOMContentLoaded", () => {
  address = document.querySelector("#address");
  port = document.querySelector("#port");
  command = document.querySelector("#command");
  message = document.querySelector("#message");
  
  document.querySelector("#send").addEventListener("click", (e) => {
    e.preventDefault();
    send_command();
  });
  
});
