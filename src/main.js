const { invoke } = window.__TAURI__.tauri;

let greetInputEl;
let greetMsgEl;

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
}


async function connectToMachine() {
  // alert(234)
  greetMsgEl.textContent = await invoke("vna_send", { address: "127.0.0.1:3000", command: "*IDN?" });
}

window.addEventListener("DOMContentLoaded", () => {
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#greet-form").addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
  });

  document.querySelector("#connect-to-machine").addEventListener("click", (e) => {
    e.preventDefault();
    connectToMachine();
  });

  
});
