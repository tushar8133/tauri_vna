const { invoke } = window.__TAURI__.core;
const { Command } = window.__TAURI__.shell;

export async function runAdb(args) {
  try {
    const cmd = Command.sidecar("binaries/adb", args);
    const result = await cmd.execute();
    let output = "";
    if (result.stdout) output += result.stdout;
    if (result.stderr) output += `\nERR: ${result.stderr}`;
    return String(output).trim();
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
  message.value = String(message.value).trim();
  message.value += "\n" + String(x).trim();
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
  const cmdText = String(command.value);
  const regex = new RegExp("^adb (.+)", "i");
  if (regex.test(cmdText)) {
    const result = await runAdb([regex.exec(cmdText)[1]]);
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

async function saveLog() {
  try {
    const path = await invoke('plugin:dialog|save', {
      options: {
        defaultPath: `log-${Date.now()}.txt`
      }
    });
    const encoder = new TextEncoder();
    await invoke('plugin:fs|write_text_file', encoder.encode(message.value), {
      headers: {
        path: encodeURIComponent(path instanceof URL ? path.toString() : path),
        options: JSON.stringify({
          baseDir: 7
        })
      }
    });
    logMessage(`Log saved at ${path}`);
    logMessage("------------------------------------------------------------");
  } catch (e) {
    logMessage(`Failed to save log: ${e}`);
    logMessage("------------------------------------------------------------");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  address = document.querySelector("#address");
  port = document.querySelector("#port");
  command = document.querySelector("#command");
  message = document.querySelector("#message");
  message.disabled = true;

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

  document.querySelector("#save-log").addEventListener("click", (e) => {
    e.preventDefault();
    saveLog();
  });

  document.querySelector("#preview2").addEventListener("change", (e) => {
    e.preventDefault();
    preview2(e);
  });

  async function preview3(data) {
    filedata = data.split("\r\n");
    // document.querySelector("#preview2").value = null;
    let noblanks = filedata.filter((line) => !(/^\s*$/.test(line)));
    do {
      await sendList(noblanks);
      logMessage("\n============================================================\n");
    } while (loop.checked)
    preventGestures(false);
  }

  async function loadScriptButtons() {
    try {
      const files = await invoke('list_iointerface_txt_files');
      const container = document.querySelector('.utilities-container > div');
      if (!container) return;
      container.innerHTML = '';
      if (!files || files.length === 0) {
        document.querySelector('.utilities-container').style.display = 'none';
        return;
      }
      document.querySelector('.utilities-container').style.display = 'block';
      files.forEach((name) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = name.replace(/\.txt$/, '');
        // btn.textContent = name;
        btn.addEventListener('click', async () => {
          try {
            const content = await invoke('read_iointerface_txt_file', { name });
            command.value = String(content);
            preview3(String(content));
          } catch (e) {
            console.error('Failed to read script', e);
            command.value = name;
          }
        });
        container.appendChild(btn);
      });
    } catch (e) {
      console.error('Failed to load script buttons', e);
    }
  }

  // populate script buttons on startup
  loadScriptButtons();

  document.addEventListener('contextmenu', event => event.preventDefault());

  command.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      send_command();
    }
  });

});
