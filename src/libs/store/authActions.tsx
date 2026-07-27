import { Store } from "@tanstack/react-store";
import type { User } from "../store";

// Auth Store
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  fullName?: string;
  branchName?: string;
  permissions: string[];
}

export const authStore = new Store<AuthState>({
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false,
  permissions: [],
});

// Auth Store Actions
export const authActions = {
  login: (
    userName: string,
    token: string,
    roles: string[],
    nationalId: string,
    fullName?: string,
    branchName?: string,
    pid?: string,
    bid?: string,
    sid?: string,
    name?: string,
    surname?: string,
    isActive?: boolean,
    creationTime?: string,
  ) => {
    // Create user object matching User interface
    const user = {
      id: nationalId,
      username: userName,
      full_name: fullName || userName,
      roles: roles.join(","),
      fullName,
      branchName,
      pid,
      bid,
      sid,
      name,
      surname,
      isActive,
      creationTime,
    };

    authStore.setState((state) => ({
      ...state,
      isAuthenticated: true,
      user,
      token,
      isLoading: false,
      fullName,
      branchName,
    }));

    // Store in localStorage
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(userName));
    localStorage.setItem("roles", JSON.stringify(roles));
    localStorage.setItem("auth_national_Id", JSON.stringify(nationalId));
    if (pid) localStorage.setItem("auth_pid", pid);
    if (bid) localStorage.setItem("auth_bid", bid);
    if (fullName) localStorage.setItem("auth_fullName", fullName);
    if (branchName) localStorage.setItem("auth_branchName", branchName);
    if (sid) localStorage.setItem("auth_sid", sid);
    if (name) localStorage.setItem("auth_name", name);
    if (surname) localStorage.setItem("auth_surname", surname);
    if (isActive !== undefined)
      localStorage.setItem("auth_isActive", String(isActive));
    if (creationTime) localStorage.setItem("auth_creationTime", creationTime);
  },

  setPermissions: (permissions: string[]) => {
    authStore.setState((state) => ({
      ...state,
      permissions,
    }));
    localStorage.setItem("permissions", JSON.stringify(permissions));
  },

  logout: () => {
    authStore.setState((state) => ({
      ...state,
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      fullName: undefined,
      branchName: undefined,
      permissions: [],
    }));
    // Clear localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("roles");
    localStorage.removeItem("permissions");
    localStorage.removeItem("auth_national_Id");
    localStorage.removeItem("auth_fullName");
    localStorage.removeItem("auth_branchName");
    localStorage.removeItem("auth_pid");
    localStorage.removeItem("auth_bid");
    localStorage.removeItem("auth_sid");
    localStorage.removeItem("auth_name");
    localStorage.removeItem("auth_surname");
    localStorage.removeItem("auth_isActive");
    localStorage.removeItem("auth_creationTime");
  },

  setLoading: (isLoading: boolean) => {
    authStore.setState((state) => ({
      ...state,
      isLoading,
    }));
  },

  initializeFromStorage: () => {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");
    const fullName = localStorage.getItem("auth_fullName") || undefined;
    const branchName = localStorage.getItem("auth_branchName") || undefined;
    const nationalId = localStorage.getItem("auth_national_Id");
    const rolesStr = localStorage.getItem("roles");
    const permissionsStr = localStorage.getItem("permissions");
    const pid = localStorage.getItem("auth_pid") || undefined;
    const bid = localStorage.getItem("auth_bid") || undefined;
    const sid = localStorage.getItem("auth_sid") || undefined;
    const name = localStorage.getItem("auth_name") || undefined;
    const surname = localStorage.getItem("auth_surname") || undefined;
    const isActive = localStorage.getItem("auth_isActive") === "true";
    const creationTime = localStorage.getItem("auth_creationTime") || undefined;

    if (token && userStr) {
      try {
        const userName = JSON.parse(userStr);
        const roles = rolesStr ? JSON.parse(rolesStr) : [];
        const permissions = permissionsStr ? JSON.parse(permissionsStr) : [];
        const nationalIdValue = nationalId ? JSON.parse(nationalId) : "";

        // Reconstruct user object matching User interface
        const user = {
          id: nationalIdValue,
          username: userName,
          full_name: fullName || userName,
          roles: Array.isArray(roles) ? roles.join(",") : roles,
          fullName,
          branchName,
          pid,
          bid,
          sid,
          name,
          surname,
          isActive,
          creationTime,
        };

        authStore.setState((state) => ({
          ...state,
          isAuthenticated: true,
          user,
          token,
          isLoading: false,
          fullName,
          branchName,
          permissions: Array.isArray(permissions) ? permissions : [],
        }));
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        authActions.logout();
      }
    }
  },
};
