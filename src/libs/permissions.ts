/**
 * Permission-based access. After login we have permissions (from API for user's roles).
 * Visibility is based on permissions (e.g. Pages.Users, Pages.Roles).
 */

import { getStoredRoles } from "./roles";
import { ADMIN_ROLE } from "./roles";

/** Parses permissions from localStorage (set after login / getPermissionsForRoleIds). */
export function getStoredPermissions(): string[] {
    try {
        const raw = localStorage.getItem("permissions");
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Returns true if the user has access: either no required permissions,
 * or user has ADMIN role (full access until API is used), or user has all required permissions.
 */
export function hasPermission(
    userPermissions: string[],
    requiredPermissions: string[] | undefined
): boolean {
    if (!requiredPermissions?.length) return true;
    const roles = getStoredRoles();
    if (roles.includes(ADMIN_ROLE)) return true;
    return requiredPermissions.every((p) => userPermissions.includes(p));
}

/**
 * Returns true if the user has at least one of the required permissions.
 * Use when menu item requires any of [Pages.X, Pages.Y].
 */
export function hasAnyPermission(
    userPermissions: string[],
    requiredPermissions: string[] | undefined
): boolean {
    if (!requiredPermissions?.length) return true;
    const roles = getStoredRoles();
    if (roles.includes(ADMIN_ROLE)) return true;
    return requiredPermissions.some((p) => userPermissions.includes(p));
}
