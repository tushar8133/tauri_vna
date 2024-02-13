// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#![allow(unused)]
use std::net::TcpStream;
use std::str::{from_utf8, FromStr};
use std::io::{BufRead, BufReader, Write};
use std::time::Duration;
use std::net::SocketAddr;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    println!("test test 2");
    format!("Hello, {}! You've been greeted from Rust!", name);
    // let response = vna_send1("127.0.0.1:3000".to_string(), "*IDN?".to_string());
    // println!("\n**** {}", &response);
    // return response.to_string();
    return "respponse from rust".to_string();
}

#[tauri::command]
fn vna_send1(address: String, command: String) -> String {
    println!("vna test");
    return command;
}

#[tauri::command]
fn vna_send(address: String, command: String) -> String {
    let remote: SocketAddr = address.parse().unwrap();
    match TcpStream::connect_timeout(&remote, Duration::from_secs(1)) {
        Ok(mut stream) => {
            stream.set_read_timeout(Some(Duration::from_millis(3000)));
            let msg = format!("{}{}", &command, "\n");
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
                    return "Failed to receive data".to_string();
                }
            }
        },
        Err(e) => {
            return "CONNECTION NOT FOUND".to_string();
        }
    }
    return "Terminated".to_string();
}


fn main() {
    tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![greet, vna_send])
    // .invoke_handler(tauri::generate_handler![vna_send])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
