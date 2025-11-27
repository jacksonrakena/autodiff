use k8s_openapi::api::core::v1::Pod;
use kube::discovery::ApiGroup;
use tauri::http::{Request, Uri};

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
async fn list_api_resources() -> Result<Vec<XApiGroup>, String> {
    use kube::discovery::Discovery;
    use kube::{Api, Client};
    // Create a Kubernetes client
    let client = Client::try_default().await.map_err(|e| e.to_string())?;
    // Discover API resources
    let discovery = Discovery::new(client)
        .run()
        .await
        .map_err(|e| e.to_string())?;
    // Collect the names of all API resources
    Ok(discovery
        .groups()
        .map(|group| XApiGroup::from_api_group(group))
        .collect())
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
async fn exec_raw(path: String) -> Result<String, String> {
    use kube::{Api, Client};

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_api_resources,
            list_pods,
            exec_raw
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
