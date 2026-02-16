#![allow(unused)]
use std::str::{from_utf8, FromStr};
use std::net::{TcpStream, SocketAddr};
use std::io::{BufRead, BufReader, Read, Write};
use std::time::Duration;
use regex::Regex;
use std::env;
use std::path::PathBuf;
use std::fs;
use base64::{engine::general_purpose, Engine as _};

#[tauri::command]
fn connect_machine1(remote: String, command: String) -> String {
    let remote: SocketAddr = remote.parse().unwrap();
    let msg = format!("{}{}", &command, "\n");
    let wait = if msg.contains("?") { 3.0 } else { 0.1 };

    match TcpStream::connect_timeout(&remote, Duration::from_millis(5000)) {
        Ok(mut stream) => {
            stream.set_read_timeout(Some(Duration::from_secs_f32(wait)));
            stream.write(msg.as_bytes()).unwrap();
            let mut reader = BufReader::new(&stream);
            let mut buffer: Vec<u8> = Vec::new();
            match reader.read_until(b'\n', &mut buffer) {
                Ok(_) => {
                    let mut resp = format!("{}", from_utf8(&buffer).expect("Could not write buffer as string"));
                    let len_withoutcrlf = resp.trim_end().len();
                    resp.truncate(len_withoutcrlf);
                    return resp;
                },
                Err(e) => {
                    if msg.contains("?") {
                        return "Timeout! Failed to receive data".to_string();
                    } else {
                        return format!("{}", "Nothing");
                    }
                }
            }
        },
        Err(e) => {
            return "Device not found".to_string();
        }
    }
    return "Terminated".to_string();
}

#[tauri::command]
fn connect_machine(remote: String, command: String) -> String {
    let remote: SocketAddr = match remote.parse() {
        Ok(r) => r,
        Err(_) => return "Invalid address".to_string(),
    };

    let msg = format!("{}\r\n", command);
    let wait = if msg.contains("?") { 3.0 } else { 0.1 };

    match TcpStream::connect_timeout(&remote, Duration::from_secs(5)) {
        Ok(mut stream) => {
            stream
                .set_read_timeout(Some(Duration::from_secs_f32(wait)))
                .unwrap();

            if stream.write_all(msg.as_bytes()).is_err() {
                return "Write failed".to_string();
            }

            // Read first byte to detect protocol
            let mut first = [0u8; 1];
            if stream.read_exact(&mut first).is_err() {
                return "No response".to_string();
            }

            // ===============================
            // SCPI DEFINITE LENGTH BINARY
            // ===============================
            if first[0] == b'#' {
                // Read digit count
                let mut digit = [0u8; 1];
                stream.read_exact(&mut digit).unwrap();
                let digits = (digit[0] - b'0') as usize;

                // Read length field
                let mut len_buf = vec![0u8; digits];
                stream.read_exact(&mut len_buf).unwrap();

                let len_str = String::from_utf8(len_buf).unwrap();
                let payload_len: usize = len_str.parse().unwrap();

                // Read EXACT payload
                let mut payload = vec![0u8; payload_len];
                stream.read_exact(&mut payload).unwrap();

                // Return Base64 (binary safe for Tauri)
                let encoded = general_purpose::STANDARD.encode(payload);
                return format!("__BINARY__{}", encoded);
            }

            // ===============================
            // ASCII / RAW FALLBACK
            // ===============================
            let mut buffer = vec![0u8; 8192];
            let mut data = vec![first[0]];

            if let Ok(n) = stream.read(&mut buffer) {
                data.extend_from_slice(&buffer[..n]);
            }

            // Try UTF-8
            if let Ok(text) = std::str::from_utf8(&data) {
                return text.trim().to_string();
            }

            // Otherwise raw binary
            let encoded = general_purpose::STANDARD.encode(&data);
            format!("__BINARY__{}", encoded)
        }

        Err(_) => "Device not found".to_string(),
    }
}

#[tauri::command]
fn list_iointerface_txt_files() -> Vec<String> {
    let home = env::var("USERPROFILE").or_else(|_| env::var("HOME")).unwrap_or_else(|_| String::from("."));
    let mut dir = PathBuf::from(home);
    dir.push("Desktop");
    dir.push("iointerface");

    let mut files: Vec<String> = Vec::new();

    if !dir.exists() {
        return files;
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "txt" {
                        if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
                            files.push(name.to_string());
                        }
                    }
                }
            }
        }
    }

    files
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, connect_machine, list_iointerface_txt_files, read_iointerface_txt_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn read_iointerface_txt_file(name: String) -> String {
    let home = env::var("USERPROFILE").or_else(|_| env::var("HOME")).unwrap_or_else(|_| String::from("."));
    let mut path = PathBuf::from(home);
    path.push("Desktop");
    path.push("iointerface");
    path.push(name);

    if !path.exists() {
        return format!("ERROR: file not found: {}", path.to_string_lossy());
    }

    match fs::read_to_string(&path) {
        Ok(contents) => contents,
        Err(e) => format!("ERROR: failed to read file: {}", e),
    }
}
