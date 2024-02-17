const { invoke } = window.__TAURI__.tauri;

let address;
let port;
let command;
let message;
let filedata = [];

function logMessage(x) {
  message.textContent = x + "\n" + message.textContent;
}

async function send_command() {
  const fullAddress = address.value + ":" + port.value;
  const result = await invoke("connect_machine", { remote: fullAddress, command: command.value });
  logMessage(result);
}

async function preview2(e) {
  filedata = [];
  var reader = new FileReader();
  console.log("HIIII")
  reader.readAsText(e.target.files[0], "UTF-8");
  reader.onload = function (evt) {
    let data = evt.target.result;
    filedata = data.split("\n")
    
    filedata.forEach( async(line) => {
      command.value = line;
      send_command();
    });
  }
  reader.onerror = function () {
    command.value = "ERROR";
  }
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

  document.querySelector("#preview2").addEventListener("change", (e) => {
    e.preventDefault();
    preview2(e);
  });

});
