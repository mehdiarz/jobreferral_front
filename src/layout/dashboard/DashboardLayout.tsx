import React from 'react'
import { Outlet } from '@tanstack/router'
import { useAppStore, useAuthStore } from '../../libs/store.ts'
import SideBar from './SideBar'
import Header from './Header'
import Footer from './Footer'

const DashboardLayout: React.FC = () => {
    const { sidebarOpen } = useAppStore()
    const { isAuthenticated, user } = useAuthStore()

    // اگر کاربر لاگین نکرده بود (در صورت نیاز به Guard کردن)
    // توجه: این بخش را اگر در Router تنظیم کرده‌ای، می‌توانی ساده‌تر کنی
    if (!isAuthenticated) {
        return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>
    }

    return (
        <div className="relative min-h-screen bg-gray-50 text-gray-900 flex overflow-hidden" dir="rtl">

            {/* 1. Sidebar Layer */}
            <SideBar />

            {/* 2. Main Content Area */}
            <div
                className={`
          flex flex-col flex-1 transition-all duration-300 ease-in-out min-w-0
          ${sidebarOpen ? 'mr-64' : 'mr-0'} 
        `}
            >
                {/* Header */}
                <Header />

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>

                {/* Footer (Contains Toast System) */}
                <Footer />
            </div>

            {/* 3. Mobile Overlay (When Sidebar is open on Mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
                    onClick={() => {
                        // استفاده از اکشن برای بستن سایدبار در موبایل
                        const { closeSidebar } = require('../../libs/store/appActions').appActions;
                        // نکته: در کد واقعی، از هوک useAppStore استفاده کن
                    }}
                />
            )}
        </div>
    )
}

export default DashboardLayout
