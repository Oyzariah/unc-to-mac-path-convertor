// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;

#[tauri::command]
fn open_path(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    Command::new("open")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    Command::new("explorer")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::Focused(is_focused) => {
                if *is_focused {
                    // Forces the webview to become the first responder on macOS
                    let _ = window.set_focus(); 
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![open_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}