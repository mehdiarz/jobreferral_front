import { useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Building,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Contact,
  CreditCardIcon,
  DatabaseIcon,
  FileDown,
  FileText,
  Home,
  Settings,
  Users,
  UsersRound,
} from "lucide-react";

import { useAppStore, useMenuStore } from "../../libs/store";
import { appActions } from "../../libs/store/appActions";

const textValue = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

const pathValue = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return null;
};

const idValue = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

type MenuChild = {
  id: string;
  title: string;
  path: string | null;
  icon?: string;
  children?: MenuChild[];
};

type MenuItem = {
  id: string;
  title: string;
  path: string | null;
  icon?: string;
  children?: MenuChild[];
};

// تابع بازگشتی برای parse کردن children
const parseChildren = (children: any[]): MenuChild[] => {
  return children.map((child, childIndex) => ({
    id: idValue(child?.id, `child-${childIndex}`),
    title: textValue(child?.title, "بدون عنوان"),
    path: pathValue(child?.path),
    icon: typeof child?.icon === "string" ? child.icon : undefined,
    children: Array.isArray(child?.children)
      ? parseChildren(child.children)
      : undefined,
  }));
};

// تابع بازگشتی برای بررسی active بودن descendants
const hasActiveDescendant = (
  children: MenuChild[] | undefined,
  currentPath: string,
): boolean => {
  if (!children) return false;

  return children.some((child) => {
    if (
      !!child.path &&
      (currentPath === child.path || currentPath.startsWith(`${child.path}/`))
    ) {
      return true;
    }
    if (child.children) {
      return hasActiveDescendant(child.children, currentPath);
    }
    return false;
  });
};

export const Sidebar = () => {
  const { items: rawMenuItems } = useMenuStore();
  const { sidebarOpen } = useAppStore();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const currentPath = useRouterState({
    select: (state) => state.location.pathname,
  });

  const menuItems: MenuItem[] = useMemo(() => {
    if (!Array.isArray(rawMenuItems)) return [];

    return rawMenuItems.map((item, itemIndex) => ({
      id: idValue(item?.id, `menu-${itemIndex}`),
      title: textValue(item?.title, "بدون عنوان"),
      path: pathValue(item?.path),
      icon: typeof item?.icon === "string" ? item.icon : undefined,
      children: Array.isArray(item?.children)
        ? parseChildren(item.children)
        : [],
    }));
  }, [rawMenuItems]);

  useEffect(() => {
    // تابع کمکی برای باز کردن خودکار منوهای parent
    const openParentMenus = (
      items: MenuItem[] | MenuChild[],
      parentIds: string[] = [],
    ) => {
      const idsToOpen: string[] = [...parentIds];

      items.forEach((item) => {
        // اگر خود item active باشه
        if (
          !!item.path &&
          (currentPath === item.path || currentPath.startsWith(`${item.path}/`))
        ) {
          idsToOpen.push(...parentIds);
        }

        // اگر descendants active باشن
        if (item.children && hasActiveDescendant(item.children, currentPath)) {
          idsToOpen.push(item.id);
          // اضافه کردن parentIds به لیست
          if (parentIds.length > 0) {
            idsToOpen.push(...parentIds);
          }
          // بازگشت برای children
          openParentMenus(item.children, [...parentIds, item.id]);
        }
      });

      return idsToOpen;
    };

    const idsToOpen = openParentMenus(menuItems);

    if (idsToOpen.length > 0) {
      setOpenMenus((prev) => {
        const next = { ...prev };

        idsToOpen.forEach((id) => {
          next[id] = true;
        });

        return next;
      });
    }
  }, [currentPath, menuItems]);

  const toggleMenu = (menuId: string) => {
    setOpenMenus((current) => ({
      ...current,
      [menuId]: !current[menuId],
    }));
  };

  const closeMobileSidebar = () => {
    if (window.innerWidth < 1024) {
      appActions.setSidebarOpen(false);
    }
  };

  const getIcon = (iconName?: string, isActive = false) => {
    const className = `h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
      isActive
        ? "text-blue-600 dark:text-blue-400"
        : "text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400"
    }`;

    switch (iconName) {
      case "home":
        return <Home className={className} />;
      case "icons":
        return <UsersRound className={className} />;
      case "file-text":
        return <FileText className={className} />;
      case "building":
        return <Building className={className} />;
      case "bar-chart-3":
        return <BarChart3 className={className} />;
      case "settings":
        return <Settings className={className} />;
      case "clipboard-list":
        return <ClipboardList className={className} />;
      case "contact":
        return <Contact className={className} />;
      case "credit-card":
        return <CreditCardIcon className={className} />;
      case "file-down":
        return <FileDown className={className} />;
      case "database":
        return <DatabaseIcon className={className} />;
      case "users":
        return <Users className={className} />;
      default:
        return null;
    }
  };

  // جدا کردن منوها به دو گروه: منوهای اصلی و منوهای فرعی
  const mainMenuItems = menuItems.slice(0, Math.ceil(menuItems.length / 2));
  const secondaryMenuItems = menuItems.slice(Math.ceil(menuItems.length / 2));

  // تابع کمکی برای رندر کردن children
  const renderChildren = (children: MenuChild[]) => {
    return children.map((child) => {
      const isChildActive =
        !!child.path &&
        (currentPath === child.path ||
          currentPath.startsWith(`${child.path}/`));

      // بررسی active بودن subChildren
      const hasActiveSubChild = child.children
        ? hasActiveDescendant(child.children, currentPath)
        : false;

      return (
        <li key={child.id} className="group/child">
          {child.path ? (
            <Link
              to={child.path}
              onClick={closeMobileSidebar}
              activeOptions={{ exact: true }}
              className={`
                relative flex items-center gap-2.5 px-3 py-2 rounded-lg
                transition-all duration-200 text-xs
                hover:bg-slate-50 dark:hover:bg-slate-700/50
                hover:translate-x-0.5
                ${
                  isChildActive
                    ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium"
                    : "text-slate-500 dark:text-slate-400"
                }
              `}
            >
              {/* Dot indicator */}
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isChildActive
                    ? "bg-blue-600 dark:bg-blue-400"
                    : "bg-slate-300 dark:bg-slate-600 group-hover/child:bg-blue-400"
                }`}
              ></span>
              <span className="truncate">{child.title}</span>
            </Link>
          ) : child.children && child.children.length > 0 ? (
            // Sub-submenu برای childهایی که path ندارن ولی children دارن
            <>
              <button
                type="button"
                onClick={() => toggleMenu(child.id)}
                className={`
                  relative flex w-full items-center gap-2.5 px-3 py-2 rounded-lg
                  transition-all duration-200 text-xs
                  hover:bg-slate-50 dark:hover:bg-slate-700/50
                  ${
                    hasActiveSubChild
                      ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium"
                      : "text-slate-500 dark:text-slate-400"
                  }
                `}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    hasActiveSubChild
                      ? "bg-blue-600 dark:bg-blue-400"
                      : "bg-slate-300 dark:bg-slate-600 group-hover/child:bg-blue-400"
                  }`}
                ></span>
                <span className="truncate flex-1 text-right">
                  {child.title}
                </span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-300 ${
                    openMenus[child.id] ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`
                  overflow-hidden transition-all duration-300 ease-out
                  ${openMenus[child.id] ? "max-h-[32rem] opacity-100 mt-0.5" : "max-h-0 opacity-0"}
                `}
              >
                <ul className="space-y-0.5 py-1 pr-3 mr-3 border-r-2 border-slate-200 dark:border-slate-700">
                  {child.children?.map((subChild) => {
                    const isSubChildActive =
                      !!subChild.path &&
                      (currentPath === subChild.path ||
                        currentPath.startsWith(`${subChild.path}/`));

                    return (
                      <li key={subChild.id} className="group/subchild">
                        <Link
                          to={subChild.path!}
                          onClick={closeMobileSidebar}
                          className={`
                            relative flex items-center gap-2.5 px-3 py-2 rounded-lg
                            transition-all duration-200 text-xs
                            hover:bg-slate-50 dark:hover:bg-slate-700/50
                            hover:translate-x-0.5
                            ${
                              isSubChildActive
                                ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium"
                                : "text-slate-500 dark:text-slate-400"
                            }
                          `}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              isSubChildActive
                                ? "bg-blue-600 dark:bg-blue-400"
                                : "bg-slate-300 dark:bg-slate-600 group-hover/subchild:bg-blue-400"
                            }`}
                          ></span>
                          <span className="truncate">{subChild.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-400 dark:text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0"></span>
              <span className="truncate">{child.title}</span>
            </div>
          )}
        </li>
      );
    });
  };

  // تابع کمکی برای رندر یک آیتم منو
  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = Boolean(item.children?.length);
    const isExpanded = openMenus[item.id] || false;
    const isActive =
      !!item.path &&
      (currentPath === item.path || currentPath.startsWith(`${item.path}/`));

    const hasActiveChild = item.children
      ? hasActiveDescendant(item.children, currentPath)
      : false;

    return (
      <li key={item.id} className="group">
        {item.path ? (
          <Link
            to={item.path}
            onClick={closeMobileSidebar}
            activeOptions={{ exact: true }}
            className={`
              relative flex items-center gap-3 px-3 py-2.5 rounded-xl
              transition-all duration-300 ease-out
              text-slate-600 dark:text-slate-300 text-[13px]
              hover:bg-slate-50 dark:hover:bg-slate-700/50
              hover:translate-x-1
              ${
                isActive
                  ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium translate-x-1"
                  : ""
              }
            `}
          >
            {/* Active Indicator */}
            {isActive && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 dark:bg-blue-500 rounded-full"></span>
            )}

            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
              {getIcon(item.icon, isActive)}
            </span>
            <span className="block min-w-0 flex-1 truncate font-medium">
              {item.title}
            </span>
          </Link>
        ) : (
          <>
            <button
              type="button"
              onClick={() => toggleMenu(item.id)}
              aria-expanded={isExpanded}
              className={`
                relative flex w-full items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-300 ease-out
                text-slate-600 dark:text-slate-300 text-[13px]
                hover:bg-slate-50 dark:hover:bg-slate-700/50
                ${hasActiveChild ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" : ""}
              `}
            >
              {/* Active Indicator */}
              {hasActiveChild && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 dark:bg-blue-500 rounded-full"></span>
              )}

              <span
                className={`p-1.5 rounded-lg transition-colors ${
                  hasActiveChild
                    ? "bg-blue-100 dark:bg-blue-900/50"
                    : "bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50"
                }`}
              >
                {getIcon(item.icon, hasActiveChild)}
              </span>
              <span className="min-w-0 flex-1 truncate text-right font-medium">
                {item.title}
              </span>

              <span
                className={`transition-transform duration-300 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )}
              </span>
            </button>

            {/* Submenu */}
            {hasChildren && (
              <div
                className={`
                  overflow-hidden transition-all duration-300 ease-out
                  ${isExpanded ? "max-h-[32rem] opacity-100 mt-0.5" : "max-h-0 opacity-0"}
                `}
              >
                <ul className="space-y-0.5 py-1 pr-3 mr-3 border-r-2 border-slate-200 dark:border-slate-700">
                  {renderChildren(item.children!)}
                </ul>
              </div>
            )}
          </>
        )}
      </li>
    );
  };

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="بستن منوی کناری"
          className="fixed inset-0 z-20 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => appActions.setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 bottom-0 right-0 left-auto z-30 m-3 flex w-100 flex-col
          rounded-2xl bg-white shadow-xl shadow-gray-200/20 transition-transform duration-300
          dark:bg-slate-800 dark:shadow-gray-900/30 
          border border-gray-200/60 dark:border-gray-700/60
          lg:sticky lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Logo Section */}
        <div className="flex justify-center border-b border-gray-100 dark:border-slate-700/50 p-5">
          <img src="/images/Logo.svg" className="mx-auto w-32" alt="Logo" />
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto py-4 px-3">
          {/* Main Menu Section */}
          <ul className="space-y-0.5">
            {mainMenuItems.map((item) => renderMenuItem(item))}
          </ul>

          {/* Secondary Menu Section */}
          <ul className="space-y-0.5">
            {secondaryMenuItems.map((item) => renderMenuItem(item))}
          </ul>
        </nav>
      </aside>
    </>
  );
};
