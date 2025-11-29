import { invoke } from "@tauri-apps/api/core";

export async function http<T>(
  path: string
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const r = await invoke("exec_raw", { path: path });
  try {
    const data = JSON.parse(r as string) as T;
    return { success: true, data };
  } catch (e) {
    return { success: false, error: r as string };
  }
}
