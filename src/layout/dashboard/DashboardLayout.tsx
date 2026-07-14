// src/layout/dashboard/DashboardLayout.tsx
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Outlet } from '@tanstack/react-router'

import { queryKeys } from '../../libs/api'
import { useAuthStore } from '../../libs/store'
import { defaultMenuItems } from '../../_shared/init.config'
import { Sidebar } from './SideBar'
import Header from './Header'
import Footer from './Footer'
import { menuActions } from '../../libs/store/menuActions'
import type { MenuItem } from '../../libs/store'

const filterMenu = (items: MenuItem[]): MenuItem[] => {
    return items
        .map(item => {
            // TODO: وقتی بک‌اند permissions نهایی شد، اینجا چک واقعی جایگزین شود
            // if (item.permissions?.length && !hasAnyPermission(userPerms, item.permissions)) return null

            if (item.children) {
                const filteredChildren = filterMenu(item.children as MenuItem[])
                if (filteredChildren.length === 0) return null
                return { ...item, children: filteredChildren }
            }
            return item
        })
        .filter(Boolean) as MenuItem[]
}

export default function DashboardLayout() {
    const { user } = useAuthStore()
    const menuQuery = useQuery({
        queryKey: queryKeys.menu.all,
        queryFn: async () => defaultMenuItems,
        staleTime: 10 * 60 * 1000,
        enabled: !!user,
    })

    useEffect(() => {
        const filtered = filterMenu(menuQuery.data ?? defaultMenuItems)
        menuActions.setItems(filtered)
    }, [menuQuery.data])

    return (
        <div className="flex h-screen bg-blue-100 dark:bg-slate-900" dir="rtl"
             style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
            <Sidebar />
            <div className="flex-1 flex flex-col pr-4 lg:pr-0">
                <Header />
                <main className="pt-2 pl-2 pb-2 flex-1">
                    <div className="bg-white dark:bg-slate-800 rounded-lg max-h-[calc(100vh-7rem)] h-full overflow-hidden">
                        <div className="p-6 overflow-y-auto h-full">
                            <Outlet />
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    )
}
