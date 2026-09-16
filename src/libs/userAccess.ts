import { ADMIN_ROLE, FULL_ADMIN_ROLE, getStoredRoles } from "./roles";
import { OrgUnitTag } from "../services/Users/authenticate.ts"; // مسیر مناسب به authenticate

/**
 * دریافت مقدار عددی orgUnitTag از لوکال استوریج
 */
export function getStoredOrgUnitTag(): number | null {
  try {
    const raw = localStorage.getItem("orgUnitTag");
    if (!raw) return null;
    const val = parseInt(raw, 10);
    return Number.isNaN(val) ? null : val;
  } catch {
    return null;
  }
}

/**
 * آیا کاربر جاری دارای دسترسی مدیر سیستم (Admin / FullAdmin) است؟
 */
export function isAdminUser(): boolean {
  const roles = getStoredRoles();
  return roles.includes(ADMIN_ROLE) || roles.includes(FULL_ADMIN_ROLE);
}

/**
 * آیا کاربر جاری متعلق به ستاد است؟
 */
export function isSetadUser(): boolean {
  const tag = getStoredOrgUnitTag();
  return tag === OrgUnitTag.Setad;
}

/**
 * آیا کاربر مجاز به فیلتر بر اساس شعبه و منطقه است؟ (ادمین یا ستاد)
 */
export function canFilterByBranchAndRegion(): boolean {
  return isAdminUser() || isSetadUser();
}
