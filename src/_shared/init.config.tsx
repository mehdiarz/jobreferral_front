export const defaultMenuItems = [
    {
        id: 'dashboard',
        title: 'داشبورد',
        icon: 'home',
        path: '/dashboard',
        permissions: [],
    },
    {
        id: 'users',
        title: 'مدیریت کاربران',
        icon: 'contact',
        children: [
            {
                id: 'users-create-page',
                title: 'ایجاد کاربر',
                icon: 'contact',
                path: '/dashboard/users/create-page',
                permissions: [],
            },
            {
                id: 'users-roles',
                title: 'نقش ها',
                icon: 'contact',
                path: '/dashboard/users/roles',
                permissions: [],
            },
        ],
    },
    {
        id: 'baseInfo',
        title: 'اطلاعات پایه',
        icon: 'building',
        children: [
            {
                id: 'experts',
                title: 'کارشناسان',
                icon: 'building',
                path: '/dashboard/base-info/experts',
                permissions: [],
            },
            {
                id: 'regions',
                title: 'مناطق',
                icon: 'building',
                path: '/dashboard/base-info/regions',
                permissions: [],
            },
            {
                id: 'collateral-types',
                title: 'انواع وثایق',
                icon: 'building',
                path: '/dashboard/base-info/collateral-types',
                permissions: [],
            },
            {
                id: 'attachment-types',
                title: 'انواع ضمائم',
                icon: 'building',
                path: '/dashboard/base-info/attachment-types',
                permissions: [],
            },
        ],
    },
] as const
