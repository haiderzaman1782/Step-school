import React from 'react';
import {
  Users,
  Receipt,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { authService } from '../services/authService';

const Sidebar = ({ activeSection, onSectionChange, user }) => {
  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      id: 'dashboard',
      role: ['owner', 'accountant'] // Clients get a different dashboard view
    },
    {
      label: 'My Record',
      icon: Users,
      id: 'clients',
      role: ['client']
    },
    {
      label: 'Clients',
      icon: Users,
      id: 'clients',
      role: ['owner', 'accountant']
    },
    {
      label: 'Vouchers',
      icon: Receipt,
      id: 'vouchers',
      role: ['owner', 'accountant', 'client']
    },
    {
      label: 'Campuses',
      icon: Building2,
      id: 'campuses',
      role: ['owner']
    },
    {
      label: 'Settings',
      icon: Settings,
      id: 'settings',
      role: ['owner', 'accountant', 'client']
    }
  ];

  const filteredItems = navItems.filter(item =>
    !item.role || item.role.includes(user?.role)
  );

  return (
    <div className="hidden lg:flex flex-col h-full bg-sidebar border-r border-sidebar-border w-64 shadow-sm">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sidebar-foreground truncate tracking-tight">Step School</span>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">{user?.role} Portal</span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-2">
        {filteredItems.map((item) => (
          <button
            key={`${item.id}-${item.label}`}
            onClick={() => onSectionChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative ${activeSection === item.id
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
          >
            <item.icon className="w-[18px] h-[18px]" />
            <span className="text-sm">{item.label}</span>
            {activeSection === item.id && (
              <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center border border-border overflow-hidden">
            <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name}</span>
            <span className="text-[10px] text-muted-foreground truncate opacity-70 italic">
              {user?.role === 'client' ? 'School Director' : user?.role === 'accountant' ? `Campus ${user?.campus_id}` : 'Global Admin'}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all group"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
