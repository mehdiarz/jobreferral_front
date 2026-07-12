import { useState } from 'react'

export default function ExpertsPage() {
    return (
        <div className="space-y-6">
            {/* فرم ثبت */}
            <div className="bg-white p-6 rounded shadow-sm border">
                <h2 className="font-bold mb-4">ثبت کارشناسان دادگستری</h2>
                <div className="grid grid-cols-2 gap-4">
                    <input className="border p-2 rounded" placeholder="نام" />
                    <input className="border p-2 rounded" placeholder="نام خانوادگی" />
                    <input className="border p-2 rounded" placeholder="کدملی" />
                    <input className="border p-2 rounded" placeholder="تلفن ثابت" />
                    <button className="bg-blue-600 text-white p-2 rounded col-span-2">ذخیره</button>
                </div>
            </div>

            {/* جدول نمایش */}
            <div className="bg-white p-6 rounded shadow-sm border">
                <h2 className="font-bold mb-4">لیست کارشناسان</h2>
                <table className="w-full text-right border-collapse">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 border">ردیف</th>
                        <th className="p-2 border">نام و نام خانوادگی</th>
                        <th className="p-2 border">کد ملی</th>
                        <th className="p-2 border">عملیات</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td className="p-2 border">1</td>
                        <td className="p-2 border">علی رضایی</td>
                        <td className="p-2 border">***123</td>
                        <td className="p-2 border text-blue-600">ویرایش / حذف</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}
