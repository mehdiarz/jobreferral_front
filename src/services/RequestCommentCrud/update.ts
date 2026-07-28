import { apiClient } from "../../libs/api";
import type { RequestCommentItem } from "./types";

interface EditRequestCommentBody {
  id: number;
  requestId: number;
  userId: number;
  description: string;
}

export async function editRequestComment(
  body: EditRequestCommentBody,
): Promise<RequestCommentItem> {
  return apiClient.request<RequestCommentItem>(
    "/services/app/RequestComment/Edit",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
