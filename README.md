# Tauri + Vanilla

This template should help get you started developing with Tauri in vanilla HTML, CSS and Javascript.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)



# steps
- npm create tauri-app@latest iointerface
    - identifier com.anritsu.iointerface
    - javascript
- cd iointerface
- copy binaries folder
- copy set-version.sh
- copy tauri_adb_app_cross_platform_starter_v_2.md
- npm i
- npx tauri add shell
- rustc -Vv | grep host | cut -f2 -d' '
- add to src-tauri/tauri.conf.json > bundle > 
    ```
    "externalBin": [
      "binaries/adb"          
    ]
    ```
- add to src-tauri/capabilities/default.json > permissions >
    ```
    {
      "identifier": "shell:allow-execute",
      "allow": [
        {
          "name": "binaries/adb",
          "sidecar": true,
          "args": true
        }
      ]
    }
    ```


# Tauri + Rust + Embedded ADB (cross‑platform) – Starter Kit

This guide gives you a **working skeleton** for a small desktop app built with **Tauri v2** and **Rust**, bundling **Android ADB** as a sidecar so it **doesn’t depend on an OS‑installed ADB**. It includes:

- Proper **sidecar** packaging for ADB (Windows/macOS/Linux, x64 + arm64)
- Capability permissions for the **Shell plugin**
- A minimal **React UI** to list devices, connect over TCP/IP, and run custom ADB commands
- Rust setup that initializes the Shell plugin

> ⚠️ **Licensing note**: ADB binaries are part of the Android SDK Platform‑Tools and are covered by Google’s SDK license. **Before redistributing, review the license** and, if needed, show an EULA or download ADB on first run after user consent. The project below assumes you provide ADB binaries legitimately.

---

## 1) Create the project

```bash
# Node 18+ and Rust toolchain installed
npm create tauri-app@latest adb-ui
cd adb-ui

# Add the Shell plugin (v2)
npm run tauri add shell
# or: pnpm tauri add shell | yarn tauri add shell | cargo tauri add shell
```

---

## 2) Add ADB sidecars

Create a folder for sidecar binaries:

```
src-tauri/
  binaries/
```

Place **per‑platform** ADB executables here, each **with a **``** suffix**. Examples of common targets:

- Windows x64 → `adb-x86_64-pc-windows-msvc.exe`
- Windows arm64 → `adb-aarch64-pc-windows-msvc.exe`
- macOS x64 → `adb-x86_64-apple-darwin`
- macOS arm64 (Apple Silicon) → `adb-aarch64-apple-darwin`
- Linux x64 (GNU) → `adb-x86_64-unknown-linux-gnu`
- Linux arm64 (GNU) → `adb-aarch64-unknown-linux-gnu`

> Keep the **base name** `adb` consistent across platforms; Tauri resolves the platform suffix at build time.

If you don’t know your current target triple, on your dev machine run:

```bash
rustc -Vv | grep host | cut -f2 -d' '   # *nix
# or PowerShell on Windows:
# rustc -Vv | Select-String "host:" | ForEach-Object {$_.Line.split(" ")[1]}
```

---

## 3) Tauri config – Bundle the sidecar

`` (merge into your file):

```json
{
  "$schema": "https://v2.tauri.app/schema.json",
  "productName": "ADB UI",
  "version": "0.1.0",
  "identifier": "com.example.adbui",
  "app": {
    "windows": [
      { "title": "ADB UI", "width": 980, "height": 720, "resizable": true }
    ]
  },
  "bundle": {
    "externalBin": [
      "binaries/adb"          
    ]
  }
}
```

> `externalBin` points to the **base** path (`binaries/adb`). Tauri will look for `adb-$TARGET_TRIPLE[.exe]` next to it during build and bundle the right one into the app.

---

## 4) Capabilities – allow executing the sidecar with args

Tauri v2 uses **capabilities** to scope permissions. Create or edit:

``

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Main window capability",
  "windows": ["main"],
  "permissions": [
    "core:default",
    {
      "identifier": "shell:allow-execute",
      "allow": [
        {
          "name": "binaries/adb",
          "sidecar": true,
          "args": true
        }
      ]
    },
    "shell:allow-open"
  ]
}
```

- `name` must match one of the entries in `bundle.externalBin`.
- `args: true` lets the UI pass arbitrary ADB arguments. For production, consider restricting with a safe allow‑list.

---

## 5) Rust: initialize Shell plugin

``

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

That’s it on the Rust side for the basic Shell‑sidecar usage.

---

## 6) Frontend UI (React + Vite example)

Replace your app component with the simple ADB console.

``

```tsx
import { useEffect, useRef, useState } from "react";
import { Command } from "@tauri-apps/plugin-shell";

function useAdb() {
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string>("");
  const append = (s: string) => setLog((p) => p + s);

  const run = async (args: string[]) => {
    setBusy(true);
    try {
      const cmd = Command.sidecar("binaries/adb", args);
      const out = await cmd.execute();
      append("$ adb " + args.join(" ") + "\n" + out.stdout + out.stderr + "\n");
    } catch (e: any) {
      append("ERR: " + (e?.message ?? String(e)) + "\n");
    } finally {
      setBusy(false);
    }
  };

  return { busy, log, run, setLog };
}

export default function App() {
  const { busy, log, run, setLog } = useAdb();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Optional: start ADB server on app load
    run(["start-server"]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitRaw = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inputRef.current?.value?.trim();
    if (!raw) return;
    const args = raw.split(/\s+/);
    run(args);
  };

  return (
    <div className="min-h-screen p-6 grid gap-4 bg-gray-50 text-gray-900">
      <h1 className="text-2xl font-semibold">ADB UI</h1>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid grid-cols-2 gap-2">
          <button className="rounded-2xl shadow px-3 py-2" disabled={busy} onClick={() => run(["devices"]) }>
            List Devices
          </button>
          <button className="rounded-2xl shadow px-3 py-2" disabled={busy} onClick={() => run(["kill-server"]) }>
            Kill Server
          </button>
          <button className="rounded-2xl shadow px-3 py-2" disabled={busy} onClick={() => run(["start-server"]) }>
            Start Server
          </button>
          <button className="rounded-2xl shadow px-3 py-2" disabled={busy} onClick={() => run(["logcat", "-d", "-t", "100"]) }>
            Grab Logcat (100 lines)
          </button>
        </div>

        <div className="grid gap-2">
          <form onSubmit={submitRaw} className="flex gap-2">
            <input ref={inputRef} className="flex-1 rounded-2xl border px-3 py-2" placeholder="custom args, e.g. shell getprop ro.product.model" />
            <button className="rounded-2xl shadow px-4" disabled={busy} type="submit">Run</button>
          </form>

          <div className="grid grid-cols-2 gap-2">
            <button className="rounded-2xl shadow px-3 py-2" disabled={busy} onClick={() => run(["tcpip", "5555"]) }>
              Enable TCP/IP (5555)
            </button>
            <button className="rounded-2xl shadow px-3 py-2" disabled={busy} onClick={() => {
              const host = prompt("Host:port?", "192.168.0.10:5555");
              if (host) run(["connect", host]);
            }}>
              Connect over Wi‑Fi
            </button>
          </div>
        </div>
      </div>

      <pre className="rounded-2xl bg-white shadow p-3 overflow-auto whitespace-pre-wrap text-sm" style={{minHeight: 240}}>
        {log || "Output will appear here…"}
      </pre>
    </div>
  );
}
```

This UI lets users:

- Start/stop ADB server
- List connected devices (USB or TCP/IP)
- Run arbitrary ADB commands
- Enable TCP/IP mode and connect over Wi‑Fi

> USB debugging must be enabled on the device (Developer options → USB debugging). On Windows, first install the appropriate USB driver for the device vendor.

---

## 7) Build & run

```bash
# Dev
npm run tauri dev

# Production build (creates installers/bundles)
npm run tauri build
```

Tauri will bundle the correct `adb-$TARGET_TRIPLE` into your app package for the platform you are building on/for.

---

## 8) Optional: streaming output & long‑running commands

For tailing `logcat` or forwarding ports interactively, you can **spawn** instead of `execute()` to stream output:

```ts
const cmd = Command.sidecar("binaries/adb", ["logcat"]);
const child = await cmd.spawn();
child.stdout.on("data", (line) => console.log(line));
child.stderr.on("data", (line) => console.warn(line));
// later: child.kill();
```

In Rust, you can do the same with `app.shell().sidecar("adb").args(["logcat"]).spawn()` and relay events to the frontend.

---

## 9) USB access tips

- **Windows**: Install OEM USB drivers (or Google USB driver for Nexus/Pixel). ADB server runs in user space; no elevated privileges required.
- **macOS**: Usually plug‑and‑play. If permissions dialogs appear for removable devices, allow them.
- **Linux**: Add udev rules for your vendor ID to avoid running ADB as root. You can either instruct the user or include a helper to write rules (needs root). For quick tests, `sudo` is not recommended inside the app; prefer documenting udev setup.

---

## 10) Security hardening (recommended before shipping)

- Replace `"args": true` with a **restricted allow‑list** of arguments your UI exposes.
- Consider sandboxing / validating `shell` commands on the Rust side.
- Sign binaries and notarize (macOS) / sign (Windows) as usual for desktop distribution.

---

## 11) Troubleshooting

- **"Executable not found"**: Check the `externalBin` entry and confirm the per‑platform file names include the correct `-$TARGET_TRIPLE` suffix and executable bit (`chmod +x`).
- **Permission denied**: Ensure capabilities include `shell:allow-execute` for `binaries/adb` and you’re calling via `@tauri-apps/plugin-shell`.
- **No devices listed**: Verify USB debugging on the phone, cable/driver, and ADB server status (try `kill-server` then `start-server`). On Linux, check udev rules.

---

## 12) What next

- Add buttons for: `adb install <apk>`, `adb pull/push`, `adb reverse/forward`, and common `adb shell` helpers.
- Persist last device / IP and command history.
- Add a background service to auto‑start ADB and watch for device add/remove (listen to `adb track-devices`).

