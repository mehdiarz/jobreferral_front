import { useMenuStore, useAppStore } from "../../libs/store"
import { appActions } from "../../libs/store/appActions"
import { useEffect, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
    CreditCardIcon,
    Contact,
    Home,
    FileText,
    Building,
    BarChart3,
    FileDown,
    Settings,
    ChevronDown,
    ClipboardList,
    UsersRound
} from 'lucide-react'

// تعریف اینترفیس برای آیتم‌های منو جهت Type-Safety
interface MenuItem {
    id: string
    title: string
    path?: string
    icon?: string
    permissions?: string[]
    children?: MenuItem[]
}

export const Sidebar = () => {
    const { items } = useMenuStore() as { items: MenuItem[] }
    const { sidebarOpen } = useAppStore() // فرض بر اینکه در appStore مقدار sidebarOpen وجود دارد
    const [collapsedMenus, setCollapsedMenus] = useState<Set<string>>(new Set())
    const routerState = useRouterState()
    const currentPath = routerState.location.pathname

    // بستن خودکار سایدبار در موبایل پس از تغییر مسیر
    useEffect(() => {
        if (sidebarOpen) {
            appActions.toggleSidebar() // تغییر وضعیت سایدبار به بسته
        }

        // پیدا کردن منوی والد فعال برای باز نگه‌داشتن آن در سایدبار
        const activeParent = items.find((item) =>
            item.children?.some((child) => currentPath.startsWith(child.path ?? ''))
        )

        if (activeParent) {
            setCollapsedMenus(new Set([activeParent.id]))
        } else {
            setCollapsedMenus(new Set())
        }
    }, [currentPath, items])

    const toggleMenu = (menuId: string) => {
        setCollapsedMenus(prev => {
            const next = new Set<string>()
            if (!prev.has(menuId)) {
                next.add(menuId)
            }
            return next
        })
    }

    const getIcon = (iconName?: string) => {
        if (!iconName) return null
        const iconClass = "w-4 h-4 ml-2"

        switch (iconName) {
            case 'home':
                return <Home className={iconClass} />
            case 'icons':
                return <UsersRound className={iconClass} />
            case 'file-text':
                return <FileText className={iconClass} />
            case 'building':
                return <Building className={iconClass} />
            case 'bar-chart-3':
                return <BarChart3 className={iconClass} />
            case 'settings':
                return <Settings className={iconClass} />
            case 'clipboard-list':
                return <ClipboardList className={iconClass} />
            case 'contact':
                return <Contact className={iconClass} />
            case 'credit-card':
                return <CreditCardIcon className={iconClass} />
            case 'file-down':
                return <FileDown className={iconClass} />
            default:
                return null
        }
    }

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => appActions.toggleSidebar()}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky bottom-2 top-2 z-50 lg:z-0 lg:right-0 w-64 bg-white dark:bg-slate-800 flex flex-col rounded-lg m-2 shadow-lg lg:shadow-none transition-all duration-300 ease-in-out
                ${sidebarOpen ? 'right-0' : '-right-72 lg:right-0'}`}
            >
                <div className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-slate-700">
                    <img src="/images/Logo.svg" className="mx-auto w-36" alt="Logo" />
                </div>
                <nav className="flex-1 py-4 overflow-y-auto">
                    <ul className="text-sm text-blue-900 dark:text-gray-200 px-2 space-y-1">
                        {items.map((item) => (
                            <li key={item.id}>
                                {item.path ? (
                                    <Link
                                        to={item.path}
                                        className="p-2.5 flex rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30 relative [&::before]:content-[''] [&::before]:absolute [&::before]:top-0 [&::before]:bottom-0 [&::before]:rounded-l-lg [&::before]:w-1 [&::before]:-right-2 mr-2 transition-colors"
                                        activeProps={{
                                            className: "bg-teal-100/70 text-teal-700 dark:text-teal-400 dark:bg-teal-950/40 [&::before]:bg-teal-500",
                                        }}
                                        activeOptions={{ exact: true }}
                                    >
                                        <div className="flex items-center">
                                            {getIcon(item.icon)}
                                            <span className="truncate w-48 block">{item.title}</span>
                                        </div>
                                    </Link>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => toggleMenu(item.id)}
                                            className="w-full text-right cursor-pointer p-2.5 flex rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30 relative mr-2 transition-colors"
                                        >
                                            <div className="flex items-center w-full">
                                                <div className="flex-shrink-0">
                                                    {getIcon(item.icon)}
                                                </div>
                                                <span className="flex-1 min-w-0 truncate text-sm">
                                                    {item.title}
                                                </span>
                                                <ChevronDown
                                                    className={`flex-shrink-0 w-4 h-4 transition-transform duration-200 mr-2 ${
                                                        collapsedMenus.has(item.id) ? 'rotate-180' : ''
                                                    }`}
                                                />
                                            </div>
                                        </button>
                                        {item.children && (
                                            <ul
                                                className={`
                                                mr-6 border-r border-teal-500/30 dark:border-teal-800 text-xs overflow-hidden transition-all duration-300 ease-in-out
                                                ${collapsedMenus.has(item.id) ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}
                                                `}
                                            >
                                                {item.children.map((child) => (
                                                    <li key={child.id}>
                                                        <Link
                                                            to={child.path}
                                                            className="p-2.5 my-0.5 rounded-lg flex hover:bg-teal-50 dark:hover:bg-teal-900/30 text-gray-600 dark:text-gray-400 transition-colors"
                                                            activeProps={{
                                                                className: "text-teal-600 dark:text-teal-400 bg-teal-100/50 dark:bg-teal-950/30 font-medium"
                                                            }}
                                                            activeOptions={{ exact: true }}
                                                        >
                                                            {child.title}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
        </>
    )
}
