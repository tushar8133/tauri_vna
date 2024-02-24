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

function preview2(e) {
  filedata = [];
  var reader = new FileReader();
  reader.readAsText(e.target.files[0], "UTF-8");
  reader.onload = function (evt) {
    let data = evt.target.result;
    filedata = data.split("\r\n");
    document.querySelector("#preview2").value = null;
    let noblanks = filedata.filter( (line) => !(/^\s*&/.test(line)));
    sendList(noblanks);
  }

  reader.onerror = function () {
    command.value = "ERROR";
  }
}

async function sendList(noblanks) {
  let comments = [];

  for (let index = 0; index < noblanks.length; index++) {
    let line = noblanks[index];
    if (/^#/.test(line)) {
      comments.push(line);
    } else {
      command.value = line;
      await send_command();
      comments.reverse().forEach(m => {
        logMessage(m);
      })
      comments = [];
    }
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
