import { Search, Menu, LayoutDashboard, Calendar, PhoneCall, CreditCard, Users, Settings, Shield, CircleX, TriangleAlert, Clock, User, LogOut, Plus } from "lucide-react";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Badge } from "./ui/badge.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "./ui/sheet.jsx";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover.jsx";
import { cn } from "./ui/utils.js";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "users", label: "Users", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];



export function TopNavigation({
  activeSection = "dashboard",
  onSectionChange = () => { },
  onLogout = () => { },
  onQuickAdd = () => { },
  adminUser = null
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-end gap-4">
        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Main navigation menu for the booking dashboard
            </SheetDescription>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-400 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">AI Booking</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Voice System</p>
                </div>
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSectionChange(item.id);
                        setMobileMenuOpen(false);
                      }}
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

                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => {
                      onQuickAdd();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-95 group"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span className="font-bold">Quick Add</span>
                  </button>
                </div>
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Search Bar */}
        <div className="flex-1 lg:px-0 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search appointments..."
              className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-white text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />



          {/* User Profile Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="hidden sm:block cursor-pointer md:hidden lg:flex items-center align-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 p-1 rounded-lg transition-colors outline-none">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {adminUser?.username || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Authorized User</p>
                </div>
                <Avatar className="h-8 w-8 border-2 border-blue-100 dark:border-blue-900/30 cursor-pointer rounded-full bg-blue-100">
                  <AvatarFallback className="text-blue-700 dark:text-blue-200 text-sm font-bold">
                    {(adminUser?.username || "A")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 dark:bg-gray-800 dark:border-gray-700 shadow-xl" align="end">
              <div className="space-y-1">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {adminUser?.username || "Administrator"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {adminUser?.email || "admin@system.com"}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-3 px-3 h-10"
                >
                  <User className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">My Profile</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-3 px-3 h-10"
                  onClick={() => onSectionChange("settings")}
                >
                  <Settings className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Settings</span>
                </Button>

                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2" />

                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 gap-3 px-3 h-10"
                  onClick={onLogout}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}

