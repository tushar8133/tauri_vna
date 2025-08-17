import fs from "fs";

fs.rmSync("package-lock.json", { force: true });
fs.rmSync("node_modules", { recursive: true, force: true });
fs.rmSync("src-tauri/Cargo.lock", { force: true });
fs.rmSync("src-tauri/target", { recursive: true, force: true });
