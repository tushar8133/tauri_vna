const { invoke } = window.__TAURI__.core;
const { Command } = window.__TAURI__.shell;

export async function runAdb(args) {
  try {
    const cmd = Command.sidecar("binaries/adb", args);
    const result = await cmd.execute();
    return `${result.stdout}${result.stderr}`;
  } catch (err) {
    return "ERROR: " + err.message;
  }
}

let address;
let port;
let command;
let message;
let filedata = [];

function logMessage(x) {
  message.value += "\n" + x;
  // message.scrollTop = message.scrollHeight;
  smoothScrollToBottom(message);
}

function smoothScrollToBottom(element) {
  const start = element.scrollTop;
  const end = element.scrollHeight;
  const duration = 500;
  const startTime = performance.now();

  function animateScroll(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    element.scrollTop = start + (end - start) * progress;

    if (progress < 1) {
      window.requestAnimationFrame(animateScroll);
    }
  }

  window.requestAnimationFrame(animateScroll);
};

async function send_command() {
  if (new RegExp("^ *adb +", "i").test(command.value)) {
    const result = await runAdb(["start-server"]);
    logMessage(`${"$ "}${command.value}\n${result}`);
  } else {
    const fullAddress = address.value + ":" + port.value;
    const result = await invoke("connect_machine", { remote: fullAddress, command: command.value });
    logMessage(`${fullAddress} ${command.value}\n${result}`);
  }
  logMessage("------------------------------------------------------------");

}

function preventGestures(val) {
  [
    document.querySelectorAll('input'),
    document.querySelectorAll('textarea'),
    document.querySelectorAll('button'),
  ].map(item => Array.from(item)).flat().forEach((el) => {
    el.disabled = val;
  })
  loop.disabled = false;
}

function preview2(e) {
  filedata = [];
  var reader = new FileReader();
  reader.readAsText(e.target.files[0], "UTF-8");
  reader.onload = async function (evt) {
    preventGestures(true);
    let data = evt.target.result;
    filedata = data.split("\r\n");
    document.querySelector("#preview2").value = null;
    let noblanks = filedata.filter((line) => !(/^\s*$/.test(line)));
    do {
      await sendList(noblanks);
      logMessage("\n============================================================\n");
    } while (loop.checked)
    preventGestures(false);
  }

  reader.onerror = function () {
    command.value = "ERROR";
  }
}

async function sendList(noblanks) {

  let comments = [];

  for (let index = 0; index < noblanks.length; index++) {

    let line = noblanks[index];
    command.value = line;

    if (/^\s*#/.test(line)) {
      comments.push(line);
      continue;
    }

    const mutliComments = comments.join("\n");
    logMessage(mutliComments);
    comments = [];

    const special = /^<([A-Z]+) (.+?)>\s*$/.exec(line);

    if (special) {
      const [specialFull, specialCmd, specialData] = special;
      if (specialCmd === "WAIT") {
        await waitforme(specialData);
      } else if (specialCmd === "TCP") {
        const [_address, _port] = specialData.split(":");
        address.value = _address;
        port.value = _port;
      }
      continue;
    }

    await send_command();
    await waitforme(0.5);

  }
  command.value = "";
}

function waitforme(sec) {
  return new Promise(resolve => {
    setTimeout(() => { resolve('') }, parseInt(sec) * 1000);
  })
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

  document.querySelector("#uploadScript").addEventListener("click", (e) => {
    document.querySelector("#preview2").click();
  });

  document.querySelector("#clear-log").addEventListener("click", (e) => {
    e.preventDefault();
    message.value = "";
    command.value = "";
  });

  document.querySelector("#preview2").addEventListener("change", (e) => {
    e.preventDefault();
    preview2(e);
  });

  document.addEventListener('contextmenu', event => event.preventDefault());

  command.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      send_command();
    }
  });

});
