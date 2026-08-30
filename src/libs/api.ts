import { authActions, authStore } from "./store/authActions";
import { getApiBaseUrl } from "./appConfig";
import { getBasePath } from "./appConfig";

const LOCAL_BASE_URL = "/job-referral-api";

export class ApiClient {
  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
    // const token = authStore.state.token || localStorage.getItem("auth_token");
    const token = authStore.state.token;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        // const { authActions } = await import('./store')
        authActions.logout();
        if (typeof window !== "undefined") {
          setTimeout(
            () => (window.location.href = `${getBasePath()}/login`),
            2000,
          );
        }
        throw new Error("رمز شما منقضی شده است. لطفاً دوباره وارد شوید.");
      }
      if (response.status === 403) {
        if (typeof window !== "undefined") {
          const forbiddenPath = `${getBasePath()}/403`;
          if (window.location.pathname !== forbiddenPath) {
            window.location.href = forbiddenPath;
          }
        }
        throw new Error("Forbidden");
      }
      const errorMessage =
        errorData?.error?.details ||
        errorData?.error?.message ||
        errorData.detail ||
        errorData.message ||
        `خطا در برقراری ارتباط با سرور (${response.status})`;
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const responseText = await response.text();
    return responseText ? (JSON.parse(responseText) as T) : (undefined as T);
  }
}

export class LocalhostClient {
  private baseUrl: string;
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData?.error?.details ||
        errorData?.error?.message ||
        errorData.detail ||
        errorData.message ||
        `خطا در برقراری ارتباط با سرور (${response.status})`;
      throw new Error(errorMessage);
    }
    if (response.status === 204) {
      return undefined as T;
    }

    const responseText = await response.text();
    return responseText ? (JSON.parse(responseText) as T) : (undefined as T);
  }
}

export const apiClient = new ApiClient();
export const localhostClient = new LocalhostClient(LOCAL_BASE_URL);

// Query Keys
export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  menu: {
    all: ["menu"] as const,
  },
  reports: {
    all: (params?: unknown) => ["reports", params] as const,
    categories: ["reports", "categories"] as const,
  },
  cards: {
    all: (params?: unknown) => ["cards", params] as const,
  },
  roles: {
    all: ["roles", "all"] as const,
    permissions: ["roles", "permissions"] as const,
  },
  users: {
    all: ["users", "all"] as const,
  },
  banks: {
    all: ["banks", "all"] as const,
  },
  levels: {
    all: ["levels", "all"] as const,
  },
  regions: {
    all: ["regions", "all"] as const,
  },
} as const;

// Common mutations
export const mutationKeys = {
  auth: {
    login: ["auth", "login"] as const,
  },
  forms: {
    submit: ["forms", "submit"] as const,
  },
} as const;
