/**
 * TokenAuth/Authenticate (ABP-style)
 * POST /api/TokenAuth/Authenticate
 * POST /api/TokenAuth/AuthenticateWithPTok
 */

import { getApiBaseUrl } from "../../libs/appConfig";

export interface AuthenticateRequest {
  userNameOrEmailAddress: string;
  password: string;
  rememberClient: boolean;
}

export interface UserObject {
  userName: string;
  name: string;
  surname: string;
  emailAddress: string;
  isActive: boolean;
  fullName: string;
  lastLoginTime: string | null;
  creationTime: string;
  /** Role names (e.g. ["ADMIN"]) */
  roleNames: string[];
  /** Role ids with names (e.g. ["1:ADMIN", "3:Reporter"]) - id before colon. Optional. */
  roles?: string[];
  id: number;
}

export interface AuthenticateResult {
  accessToken: string;
  encryptedAccessToken: string;
  expireInSeconds: number;
  userId: number;
  userObject?: UserObject;
}

export interface AuthenticateSuccessResponse {
  result: AuthenticateResult;
  targetUrl: string | null;
  success: true;
  error: null;
  unAuthorizedRequest: boolean;
  __abp: true;
}

export interface AuthenticateErrorResponse {
  result: null;
  targetUrl: string | null;
  success: false;
  error: {
    code: number;
    message: string;
    details: string | null;
    validationErrors: unknown;
  };
  unAuthorizedRequest: boolean;
  __abp: true;
}

export type AuthenticateResponse =
  AuthenticateSuccessResponse | AuthenticateErrorResponse;

/** Normalized result for authActions.login */
export interface AuthLoginPayload {
  token: string;
  /** Role names for display (e.g. ["ADMIN"]) */
  roles: string[];
  /** Role IDs parsed from userObject.roles "id:Name" (e.g. [1, 3]) for GetRoleForEditByIdList */
  roleIds: number[];
  nationalId: string;
  fullName: string;
  branchName?: string;
}

/** Authenticate with p and tok (POST /api/TokenAuth/AuthenticateWithPTok) */
export async function authenticateWithToken(
  p: string,
  tok: string,
  rememberClient: boolean = true,
): Promise<AuthLoginPayload> {
  const url = `${getApiBaseUrl()}/TokenAuth/AuthenticateWithPTok`;
  const body = { p, tok, rememberClient };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data: AuthenticateResponse = await res
    .json()
    .catch(() => ({}) as AuthenticateResponse);

  if (!data.success || !data.result) {
    const msg =
      (data as AuthenticateErrorResponse).error?.details ||
      (data as AuthenticateErrorResponse).error?.message ||
      "Login failed!";
    throw new Error(msg);
  }

  return parseAuthResult((data as AuthenticateSuccessResponse).result, "User");
}

export async function authenticate(
  userNameOrEmailAddress: string,
  password: string,
  rememberClient: boolean = true,
): Promise<AuthLoginPayload> {
  const url = `${getApiBaseUrl()}/TokenAuth/Authenticate`;
  const body: AuthenticateRequest = {
    userNameOrEmailAddress,
    password,
    rememberClient,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data: AuthenticateResponse = await res
    .json()
    .catch(() => ({}) as AuthenticateResponse);

  if (!data.success || !data.result) {
    const msg =
      (data as AuthenticateErrorResponse).error?.details ||
      (data as AuthenticateErrorResponse).error?.message ||
      "Login failed!";
    throw new Error(msg);
  }

  return parseAuthResult(
    (data as AuthenticateSuccessResponse).result,
    userNameOrEmailAddress,
  );
}

function parseAuthResult(
  result: AuthenticateResult,
  fallbackName: string,
): AuthLoginPayload {
  const user = result.userObject;
  const rolesWithId = user?.roles ?? [];
  const roleIds = rolesWithId
    .map((r) => {
      const parts = String(r).trim().split(":");
      const id = parseInt(parts[0], 10);
      return Number.isNaN(id) ? null : id;
    })
    .filter((id): id is number => id != null);

  return {
    token: result.accessToken,
    roles: user?.roleNames ?? ["User"],
    roleIds,
    nationalId: String(user?.id ?? result.userId),
    fullName: user?.fullName ?? fallbackName,
    branchName: undefined,
  };
}
