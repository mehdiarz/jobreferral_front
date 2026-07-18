import { DoorOpen, Menu, User } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { authActions } from "../../libs/store/authActions";
import { useAuthStore } from "../../libs/store";
import { appActions } from "../../libs/store/appActions";

export default function Header() {
  const router = useRouter();
  const { fullName } = useAuthStore();

  return (
    <>
      <header className="flex items-center mt-2 ml-2">
        <button
          onClick={() => {
            appActions.toggleSidebar();
          }}
          className="bg-blue-900 hover:bg-blue-950 text-white py-3 rounded-full text-sm cursor-pointer flex justify-start items-center px-3 h-11 w-11 lg:hidden"
        >
          <span className="ml-auto flex items-center gap-3">
            <Menu className="w-5 h-5" />
          </span>
        </button>

        <div className="bg-blue-900 text-white px-4 py-3 rounded-lg ml-2 mr-2 lg:mr-0 text-sm flex-1 h-11 dark:bg-slate-800">
          <div className="flex flex-row gap-2 items-center">
            <User className="w-5 h-5" />
            <span className="ml-0.5">{fullName ?? "—"}</span>
          </div>
        </div>
        <button
          onClick={() => {
            authActions.logout();
            router.navigate({ to: "/login" });
          }}
          className="bg-red-600 hover:bg-red-700 text-red-200 py-3 rounded-full text-sm cursor-pointer flex justify-start items-center px-3 h-11 w-11 hover:w-22 overflow-hidden transition-all duration-100"
        >
          <span className="ml-auto flex items-center gap-3">
            <DoorOpen className="w-5 h-5" />
            خروج
          </span>
        </button>
      </header>
    </>
  );
}
