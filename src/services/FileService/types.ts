export interface StartUploadRequest {
  fileName: string;
  fileSize: number;
  chunkSize: number;
}

export interface StartUploadResponse {
  uploadId: string;
}

export interface UploadChunkResponse {
  success: boolean;
  index?: number;
}

export interface UploadSession {
  uploadId: string;
  fileName: string;
  fileSize: number;
  chunkSize: number;
  status: string;
  lastConfirmedChunk: number;
  uploadedBytes: number;
}

export interface ChunkUploadState {
  uploadId: string;
  file: File;
  totalChunks: number;
  uploadedChunks: number;
  isPaused: boolean;
  isCompleted: boolean;
  error: string | null;
}
