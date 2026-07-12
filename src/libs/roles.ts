/**
 * Role checks. API returns roleNames (e.g. ["ADMIN"]).
 * ADMIN is treated as having full access (passes any role requirement).
 */

export const ADMIN_ROLE = "ADMIN";

/**
 * Returns true if the user has at least one of the required roles.
 * If user has ADMIN, always returns true (most access).
 */
export function hasAnyRole(
    userRoles: string[],
    requiredRoles: string[] | undefined
): boolean {
    if (!requiredRoles?.length) return true;
    if (userRoles.includes(ADMIN_ROLE)) return true;
    return requiredRoles.some((r) => userRoles.includes(r));
}

/** Parses roles from localStorage (same format as auth store). */
export function getStoredRoles(): string[] {
    try {
        const raw = localStorage.getItem("roles");
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}
