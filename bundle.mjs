import fs from "fs";
import os from "os";

const platform = os.platform();

const src = `src-tauri/packages/platform-tools-${platform}`;

const dest = "src-tauri/resources";

// fs.rmSync("C:/Users/tushar/AppData/Local/iointerface", { recursive: true, force: true });
// fs.rmSync("src-tauri/target/release/bundle/", { recursive: true, force: true });

fs.rmSync(dest, { recursive: true, force: true });

if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
} else {
    throw new Error("bundle.mjs >> error copying platform-tools");
}

console.log("bundle.mjs >> platform-tools copied", dest);
