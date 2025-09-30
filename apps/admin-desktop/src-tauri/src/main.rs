#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::Utc;
use serde_json::Value;
use std::fs;
use std::io::ErrorKind;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

const DEFAULT_IMAGE_CONTENT: &str = include_str!("../../../../shared/content/images.json");

#[tauri::command]
fn greet_owner(name: &str) -> String {
    format!("Welcome back, {}! Let's build unforgettable events.", name)
}

#[tauri::command]
fn open_calendar(app: AppHandle) -> Result<(), String> {
    app
        .shell()
        .open("https://calendar.google.com", None)
        .map_err(|err| err.to_string())
}

#[tauri::command]
fn load_image_content() -> Result<Value, String> {
    let path = resolve_content_path();
    let payload = match fs::read_to_string(&path) {
        Ok(contents) => contents,
        Err(err) => {
            if err.kind() == ErrorKind::NotFound {
                ensure_parent_exists(&path)?;
                fs::write(&path, DEFAULT_IMAGE_CONTENT).map_err(|e| e.to_string())?;
                DEFAULT_IMAGE_CONTENT.to_string()
            } else {
                return Err(err.to_string());
            }
        }
    };

    serde_json::from_str(&payload).map_err(|err| err.to_string())
}

#[tauri::command]
fn save_image_content(mut content: Value) -> Result<Value, String> {
    if let Value::Object(ref mut map) = content {
        map.insert(
            "updatedAt".into(),
            Value::String(Utc::now().to_rfc3339()),
        );
    }

    let path = resolve_content_path();
    ensure_parent_exists(&path)?;

    let serialized = serde_json::to_string_pretty(&content).map_err(|err| err.to_string())?;
    fs::write(&path, serialized).map_err(|err| err.to_string())?;

    Ok(content)
}

fn resolve_content_path() -> PathBuf {
    if let Ok(custom) = std::env::var("TPS_IMAGE_CONTENT_PATH") {
        let candidate = PathBuf::from(custom);
        if candidate.is_absolute() {
            return candidate;
        } else {
            return project_root().join(candidate);
        }
    }

    project_root()
        .join("shared")
        .join("content")
        .join("images.json")
}

fn project_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
    .join("..")
}

fn ensure_parent_exists(path: &Path) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet_owner,
            open_calendar,
            load_image_content,
            save_image_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::env;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn unique_temp_path() -> PathBuf {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        env::temp_dir().join(format!("tps-images-{stamp}.json"))
    }

    #[test]
    fn load_and_save_roundtrip() {
        let path = unique_temp_path();
        if path.exists() {
            let _ = fs::remove_file(&path);
        }

        env::set_var("TPS_IMAGE_CONTENT_PATH", &path);

        let loaded = load_image_content().expect("should load default content");
        assert!(loaded
            .get("hero")
            .and_then(|hero| hero.get("primary"))
            .and_then(|primary| primary.get("url"))
            .is_some());

        let mut updated = loaded.clone();
        if let Some(hero_obj) = updated
            .get_mut("hero")
            .and_then(|hero| hero.as_object_mut())
        {
            if let Some(primary) = hero_obj
                .get_mut("primary")
                .and_then(|value| value.as_object_mut())
            {
                primary.insert("label".into(), json!("Updated Label"));
            }
        }

        let saved = save_image_content(updated.clone()).expect("should persist updates");
        assert_eq!(
            saved["hero"]["primary"]["label"],
            json!("Updated Label"),
            "saved payload should reflect mutations"
        );

        let persisted_raw = fs::read_to_string(&path).expect("file should exist after save");
        let persisted: Value = serde_json::from_str(&persisted_raw).expect("persisted json should parse");
        assert_eq!(persisted["hero"]["primary"]["label"], json!("Updated Label"));
        assert!(persisted["updatedAt"].is_string());

        env::remove_var("TPS_IMAGE_CONTENT_PATH");
        let _ = fs::remove_file(path);
    }
}
