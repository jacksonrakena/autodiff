use std::ops::{Deref, DerefMut};
use k8s_openapi::api::core::v1::Pod;
use kube::{Client, Discovery};
use kube::discovery::ApiGroup;
use tauri::http::{Request, Uri};
use tauri::{async_runtime, Manager, State};
use tauri::async_runtime::Mutex;

#[derive(Debug, serde::Serialize)]
struct XApiResource {
    kind: String,
    plural: String,
}

#[derive(Debug, serde::Serialize)]
struct XApiGroup {
    name: String,
    version: String,
    resources: Vec<XApiResource>,
}
impl XApiGroup {
    fn from_api_group(group: &ApiGroup) -> Self {
        XApiGroup {
            name: group.name().to_string(),
            version: group.preferred_version_or_latest().to_string(),
            resources: group
                .recommended_resources()
                .into_iter()
                .map(|res| XApiResource {
                    kind: res.0.kind.clone(),
                    plural: res.0.plural.clone(),
                })
                .collect(),
        }
    }
}
#[tauri::command]
async fn list_api_resources(state: CommandGlobalState<'_>) -> Result<Vec<XApiGroup>, String> {
    let mut state = state.lock().await;

    // Lazily initialize discovery if needed
    if state.kube_discovery.is_none() {
        state.kube_discovery = Some(Discovery::new(state.kube_client.clone()));
    }

    // Move the Discovery out, run it, and put it back to avoid moving out of the MutexGuard field
    if let Some(mut discovery) = state.kube_discovery.take() {
        // If it has no groups yet, perform the run to populate cache
        let needs_run = discovery.groups().next().is_none();
        if needs_run {
            discovery = discovery.run().await.map_err(|e| e.to_string())?;
        }
        state.kube_discovery = Some(discovery);
    }

    let groups = state
        .kube_discovery
        .as_ref()
        .unwrap()
        .groups()
        .map(XApiGroup::from_api_group)
        .collect();

    Ok(groups)
}


#[tauri::command]
async fn list_pods() -> Result<Vec<Pod>, String> {
    use k8s_openapi::api::core::v1::Pod;
    use kube::{Api, Client};
    // Create a Kubernetes client
    let client = Client::try_default().await.map_err(|e| e.to_string())?;
    // Access the Pod API in the default namespace
    let pods: Api<Pod> = Api::all(client);
    // List the pods
    let pod_list = pods
        .list(&Default::default())
        .await
        .map_err(|e| e.to_string())?;
    Ok(pod_list.items)
}

#[tauri::command]
async fn exec_raw(state: CommandGlobalState<'_>, path: String) -> Result<String, String> {

    // Create a Kubernetes client
    let client = Client::try_default().await.map_err(|e| e.to_string())?;

    let response = client.request_text(
        Request::builder()
            .uri(path.parse::<Uri>().map_err(|e| e.to_string())?)
            .body("".into())
            .unwrap(),
    );
    let data = response.await.map_err(|e| e.to_string())?;
    Ok(data)
}

struct GlobalState {
    kube_client: Client,
    kube_discovery: Option<Discovery>,
}

type CommandGlobalState<'a> = State<'a, Mutex<GlobalState>>;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            async_runtime::block_on(async {
                let client = Client::try_default().await.unwrap();

                app.manage(Mutex::new(GlobalState {
                    kube_client: client.clone(),
                    kube_discovery: Some(Discovery::new(client)),
                }));
            });
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_api_resources,
            list_pods,
            exec_raw
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
