import fs from "fs";
import os from "os";

try {
    const platform = os.platform();
    const src = `src-tauri/packages/platform-tools-${platform}`;
    const dest = "src-tauri/resources";

    if (String(platform).includes("win")) {
        fs.rmSync(`${os.homedir()}/AppData/Local/iointerface`, { recursive: true, force: true });
        fs.rmSync("src-tauri/target/release/bundle/", { recursive: true, force: true });
    }

    fs.rmSync(dest, { recursive: true, force: true });

    if (fs.existsSync(src)) {
        fs.cpSync(src, dest, { recursive: true });
    }
    console.log("bundle.mjs >> successful");
} catch (e) {
    throw new Error("bundle.mjs >>", e);
}
