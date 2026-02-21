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
import { CreditCard as TopCreditCard, Building2 } from "lucide-react";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, role: ['owner', 'accountant'] },
  { id: "clients", label: "Registry", icon: Users, role: ['owner', 'accountant'] },
  { id: "clients", label: "My Record", icon: Users, role: ['client'] },
  { id: "vouchers", label: "Vouchers", icon: CreditCard, role: ['owner', 'accountant', 'client'] },
  { id: "campuses", label: "Campuses", icon: Building2, role: ['owner'] },
  { id: "settings", label: "Settings", icon: Settings, role: ['owner', 'accountant', 'client'] },
];



export function TopNavigation({
  activeSection = "dashboard",
  onSectionChange = () => { },
  onLogout = () => { },
  onQuickAdd = () => { },
  user = null
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredItems = menuItems.filter(item =>
    !item.role || item.role.includes(user?.role)
  );

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-50">
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
                  <h2 className="font-bold text-gray-900 dark:text-white">Step School</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Payment Portal</p>
                </div>
              </div>
              <nav className="space-y-1">
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <button
                      key={`${item.id}-${item.label}`}
                      onClick={() => {
                        onSectionChange(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-bold text-sm tracking-tight">{item.label}</span>
                    </button>
                  );
                })}
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
              <button className="flex cursor-pointer items-center align-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 p-1 rounded-lg transition-colors outline-none">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role || "Member"}</p>
                </div>
                <Avatar className="h-8 w-8 border-2 border-indigo-100 dark:border-indigo-900/30 cursor-pointer rounded-full bg-indigo-100">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="text-indigo-700 dark:text-indigo-200 text-sm font-bold">
                    {(user?.name || "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 dark:bg-gray-800 dark:border-gray-700 shadow-xl" align="end">
              <div className="space-y-1">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
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

