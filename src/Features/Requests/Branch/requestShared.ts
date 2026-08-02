import type { Dispatch, SetStateAction } from "react";
import { uploadChunk } from "../../../services/FileService/uploadChunk";
import type { RequestItem } from "../../../services/RequestCrud/types";
import { isoToPersian } from "../../../utils/persianToISO";

export const REQUEST_CHUNK_SIZE = 2 * 1024 * 1024;

export interface RequestOption {
  id: number;
  title: string;
}

export interface UploadState {
  file: File;
  uploadId: string;
  totalChunks: number;
  lastUploadedChunk: number;
  isPaused: boolean;
  isCompleting: boolean;
}

export interface RequestTableFilter {
  key: string;
  value: string;
}

function normalizeFilterValue(value: unknown): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  return String(value ?? "")
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/\//g, "-")
    .trim()
    .toLocaleLowerCase("fa");
}

export function filterRequestItems(
  items: RequestItem[],
  filters: RequestTableFilter[],
): RequestItem[] {
  return items.filter((request) =>
    filters.every(({ key, value }) => {
      const query = normalizeFilterValue(value);
      if (!query) return true;

      const fieldValue = (() => {
        switch (key) {
          case "title":
            return request.title;
          case "loanNumber":
            return request.loanNumber;
          case "requestStatusTitle":
            return request.requestStatusTitle;
          case "actorUserFullName":
            return request.actorUserFullName;
          case "creationTime":
            return request.creationTime
              ? `${isoToPersian(request.creationTime)} ${request.creationTime}`
              : "";
          default:
            return "";
        }
      })();

      return normalizeFilterValue(fieldValue).includes(query);
    }),
  );
}

interface UploadChunksParams<T extends { id: string; uploadProgress: number }> {
  itemId: string;
  file: File;
  uploadId: string;
  totalChunks: number;
  startIndex: number;
  cancelRef: React.RefObject<Set<string>>;
  uploadStateRef: React.RefObject<Map<string, UploadState>>;
  setFiles: Dispatch<SetStateAction<T[]>>;
}

export async function uploadChunksSequentially<
  T extends { id: string; uploadProgress: number },
>({
  itemId,
  file,
  uploadId,
  totalChunks,
  startIndex,
  cancelRef,
  uploadStateRef,
  setFiles,
}: UploadChunksParams<T>): Promise<void> {
  for (let index = startIndex; index < totalChunks; index++) {
    if (cancelRef.current.has(itemId)) {
      cancelRef.current.delete(itemId);
      throw new Error("آپلود لغو شد");
    }

    const state = uploadStateRef.current.get(itemId);
    if (state?.isPaused) {
      state.lastUploadedChunk = index - 1;
      throw new Error("آپلود متوقف شد");
    }

    const start = index * REQUEST_CHUNK_SIZE;
    const end = Math.min(start + REQUEST_CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    try {
      await uploadChunk(uploadId, index, chunk, file.name, (chunkPercent) => {
        const overall = Math.round(
          ((index + chunkPercent / 100) / totalChunks) * 100,
        );
        setFiles((previous) =>
          previous.map((item) =>
            item.id === itemId ? { ...item, uploadProgress: overall } : item,
          ),
        );
      });

      if (state) state.lastUploadedChunk = index;
      setFiles((previous) =>
        previous.map((item) =>
          item.id === itemId
            ? {
                ...item,
                uploadProgress: Math.round(((index + 1) / totalChunks) * 100),
              }
            : item,
        ),
      );
    } catch (error: unknown) {
      if (state) {
        state.lastUploadedChunk = index - 1;
        state.isPaused = true;
      }
      throw new Error(`خطا در آپلود: ${getErrorMessage(error)}`, {
        cause: error,
      });
    }
  }
}

export function getErrorMessage(
  error: unknown,
  fallback = "خطای ناشناخته",
): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function extractEntityId(value: unknown, entityName: string): number {
  const response = value as { id?: number; result?: { id?: number } } | null;
  const id = response?.result?.id ?? response?.id;

  if (!id) {
    throw new Error(`شناسه ${entityName} از سرور دریافت نشد`);
  }

  return id;
}
