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
    FileDown,
    FileText,
    Home,
    Settings,
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
};

type MenuItem = {
    id: string;
    title: string;
    path: string | null;
    icon?: string;
    children?: MenuChild[];
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
                ? item.children.map((child, childIndex) => ({
                    id: idValue(child?.id, `menu-${itemIndex}-child-${childIndex}`),
                    title: textValue(child?.title, "بدون عنوان"),
                    path: pathValue(child?.path),
                    icon: typeof child?.icon === "string" ? child.icon : undefined,
                }))
                : [],
        }));
    }, [rawMenuItems]);

    useEffect(() => {
        const activeParents = menuItems.filter((item) =>
            item.children?.some(
                (child) =>
                    !!child.path &&
                    (currentPath === child.path ||
                        currentPath.startsWith(`${child.path}/`)),
            ),
        );

        if (activeParents.length > 0) {
            setOpenMenus((prev) => {
                const next = { ...prev };

                activeParents.forEach((item) => {
                    next[item.id] = true;
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

    const getIcon = (iconName?: string) => {
        const className = "ml-2 h-4 w-4 shrink-0";

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
            default:
                return null;
        }
    };

    return (
        <>
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="بستن منوی کناری"
                    className="fixed inset-0 z-20 bg-slate-900/60 lg:hidden"
                    onClick={() => appActions.setSidebarOpen(false)}
                />
            )}

            <aside
                className={`
                    fixed top-0 bottom-0 right-0 left-auto z-30 m-2 flex w-64 flex-col
                    rounded-lg bg-white shadow-lg transition-transform duration-300
                    dark:bg-slate-800 lg:sticky lg:translate-x-0
                    ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
                `}
            >
                <div className="flex justify-center border-b border-slate-100 p-4 dark:border-slate-700">
                    <img
                        src="/images/Logo.svg"
                        className="mx-auto w-36"
                        alt="Logo"
                    />
                </div>

                <nav className="min-h-0 flex-1 overflow-y-auto py-2">
                    <ul className="px-2 text-sm text-blue-900 dark:text-white">
                        {menuItems.map((item) => {
                            const hasChildren = Boolean(item.children?.length);
                            const isExpanded = openMenus[item.id] || false;

                            const hasActiveChild = item.children?.some(
                                (child) =>
                                    !!child.path &&
                                    (currentPath === child.path ||
                                        currentPath.startsWith(`${child.path}/`)),
                            );

                            return (
                                <li key={item.id} className="mb-1">
                                    {item.path ? (
                                        <Link
                                            to={item.path}
                                            onClick={closeMobileSidebar}
                                            activeOptions={{ exact: true }}
                                            className="relative flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-teal-100 dark:hover:bg-teal-800"
                                            activeProps={{
                                                className:
                                                    "bg-teal-100 font-medium text-teal-700 dark:bg-teal-800 dark:text-teal-300",
                                            }}
                                        >
                                            {getIcon(item.icon)}
                                            <span className="block min-w-0 flex-1 truncate">
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
                                                    relative flex w-full items-center gap-2 rounded-lg p-2
                                                    transition-colors hover:bg-teal-100 dark:hover:bg-teal-800
                                                    ${hasActiveChild ? "bg-teal-100 dark:bg-teal-800" : ""}
                                                `}
                                            >
                                                {getIcon(item.icon)}
                                                <span className="min-w-0 flex-1 truncate text-right">
                                                    {item.title}
                                                </span>

                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 shrink-0" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 shrink-0" />
                                                )}
                                            </button>

                                            {hasChildren && (
                                                <ul
                                                    className={`
                                                        overflow-hidden border-r border-teal-500
                                                        pr-2 text-xs transition-all duration-300 ease-in-out
                                                        ${isExpanded ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"}
                                                    `}
                                                >
                                                    {item.children?.map((child) => (
                                                        <li key={child.id}>
                                                            {child.path ? (
                                                                <Link
                                                                    to={child.path}
                                                                    onClick={closeMobileSidebar}
                                                                    activeOptions={{ exact: true }}
                                                                    className="mx-2 my-1 flex items-center gap-2 rounded-lg p-2 hover:bg-teal-100 dark:hover:bg-teal-800"
                                                                    activeProps={{
                                                                        className:
                                                                            "bg-teal-100 font-medium text-teal-700 dark:bg-teal-800 dark:text-teal-300",
                                                                    }}
                                                                >
                                                                    {child.icon && getIcon(child.icon)}
                                                                    <span className="truncate">
                                                                        {child.title}
                                                                    </span>
                                                                </Link>
                                                            ) : (
                                                                <div className="mx-2 my-1 flex items-center gap-2 rounded-lg p-2 text-slate-400">
                                                                    {child.icon && getIcon(child.icon)}
                                                                    <span className="truncate">
                                                                        {child.title}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>
        </>
    );
};
