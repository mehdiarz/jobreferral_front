import { getApiBaseUrl } from "../../libs/appConfig";
import { authStore } from "../../libs/store/authActions";
import type { UploadChunkResponse } from "./types";

export async function uploadChunk(
  uploadId: string,
  index: number,
  chunk: Blob,
  fileName: string,
  onProgress?: (percent: number) => void,
): Promise<UploadChunkResponse> {
  const baseUrl = getApiBaseUrl();
  const token = authStore.state.token || localStorage.getItem("auth_token");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${baseUrl}/services/app/FileServiceAppServie/UploadChunk?uploadId=${uploadId}&index=${index}`;

    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    const formData = new FormData();
    formData.append("chunk", chunk, fileName);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      console.log(
        `📡 Chunk response status: ${xhr.status}`,
        xhr.responseText?.substring(0, 200),
      );

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve({ success: true, index });
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      console.error("🌐 Network error for chunk upload");
      reject(new Error("Network error"));
    };
    xhr.send(formData);
  });
}
