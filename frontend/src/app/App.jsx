import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar.jsx";
import { TopNavigation } from "./components/TopNavigation.jsx";
import { Login } from "./components/Login.jsx";
import { Settings } from "./components/Settings.jsx";
import { Payments } from "./components/Payments.jsx";
import { Users } from "./components/Users.jsx";
import { AccountantPortal } from "./components/AccountantPortal.jsx";
import { ClientPortal } from "./components/ClientPortal.jsx";
import { QuickAddModal } from "./components/QuickAddModal.jsx";
import { ThemeProvider } from "./providers/ThemeProvider.jsx";
import { authService } from "./services/authService";
import { toast, Toaster } from "sonner";

function DashboardContent() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user && authService.isAuthenticated()) {
      setIsAuthenticated(true);
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setActiveSection("dashboard");
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    toast.success("Logged out successfully");
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onQuickAdd={() => setIsQuickAddOpen(true)}
        userRole={currentUser?.role}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
          onQuickAdd={() => setIsQuickAddOpen(true)}
          adminUser={currentUser}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {activeSection === "dashboard" && (
              currentUser?.role === "accountant" ? <AccountantPortal key={`dash-${refreshKey}`} /> : <ClientPortal />
            )}
            {activeSection === "payments" && (
              currentUser?.role === "accountant" ? <Payments key={`vouch-${refreshKey}`} /> : <ClientPortal />
            )}
            {activeSection === "users" && currentUser?.role === "accountant" && <Users key={`user-${refreshKey}`} />}
            {activeSection === "settings" && <Settings user={currentUser} />}
          </div>
        </main>

        <QuickAddModal
          isOpen={isQuickAddOpen}
          onOpenChange={setIsQuickAddOpen}
          onSuccess={() => setRefreshKey(prev => prev + 1)}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DashboardContent />
      <Toaster richColors closeButton />
    </ThemeProvider>
  );
}
