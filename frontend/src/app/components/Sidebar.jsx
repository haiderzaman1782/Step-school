import { LayoutDashboard, Calendar, PhoneCall, CreditCard, Users, Settings, Shield, Plus } from "lucide-react";
import { cn } from "./ui/utils.js";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "users", label: "Users", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeSection, onSectionChange, onQuickAdd }) {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-screen p-4">
      <div className="mb-8">
        <div className="flex items-center gap-2 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-400 rounded-lg flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div className="">
            <h2 className="font-bold text-gray-900 dark:text-white">AI Booking</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Voice System</p>
          </div>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-teal-400 text-white shadow-md"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={onQuickAdd}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-95 group"
        >
          <div className="bg-white/20 rounded-lg p-1 group-hover:bg-white/30 transition-colors">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">Quick Add</span>
        </button>
      </div>
    </aside>
  );
}

