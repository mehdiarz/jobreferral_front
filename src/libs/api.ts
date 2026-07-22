import { authActions, authStore } from "./store/authActions";
import { getApiBaseUrl } from "./appConfig";

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
          setTimeout(() => (window.location.href = "/login"), 2000);
        }
        throw new Error("رمز شما منقضی شده است. لطفاً دوباره وارد شوید.");
      }
      const errorMessage =
        errorData?.error?.details ||
        errorData?.error?.message ||
        errorData.detail ||
        errorData.message ||
        `خطا در برقراری ارتباط با سرور (${response.status})`;
      throw new Error(errorMessage);
    }

    return response.json();
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
    return response.json();
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
    all: (params?: any) => ["reports", params] as const,
    categories: ["reports", "categories"] as const,
  },
  cards: {
    all: (params?: any) => ["cards", params] as const,
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
