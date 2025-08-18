const { invoke } = window.__TAURI__.core;
const { Command } = window.__TAURI__.shell;

// runAdb(["devices"]);
// runAdb(["start-server"]);
// runAdb(["kill-server"]);
// runAdb(["logcat", "-d", "-t", "100"]);
// runAdb(["tcpip", "5555"]);
// runAdb(["connect", prompt("Enter host:port", "192.168.0.10:5555")]);
// runAdb(["start-server"]);
export async function runAdb(args) {
  try {
    const cmd = Command.sidecar("binaries/adb", args);
    const result = await cmd.execute();
    return `$ adb ${args.join(" ")}\n${result.stdout}${result.stderr}\n`;
  } catch (err) {
    return "ERR: " + err.message + "\n";
  }
}
