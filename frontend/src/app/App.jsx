import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar.jsx";
import { TopNavigation } from "./components/TopNavigation.jsx";
import { Login } from "./components/Login.jsx";
import { Settings } from "./components/Settings.jsx";
import { ThemeProvider } from "./providers/ThemeProvider.jsx";
import { authService } from "./services/authService";
import { dashboardService } from "./services/dashboardService";
import { toast, Toaster } from "sonner";
import { DashboardCharts } from "./components/DashboardCharts.jsx";
import {
  Users as UsersIcon,
  Receipt as ReceiptIcon,
  TrendingUp,
  Clock
} from 'lucide-react';

// Modern Simplified Components
import ClientList from "../components/school/ClientList.jsx";
import ClientDetail from "../components/school/ClientDetail.jsx";
import ClientForm from "../components/school/ClientForm.jsx";
import SchoolVoucherList from "../components/school/SchoolVoucherList.jsx";
import CampusList from "../components/school/CampusList.jsx";

const formatPkr = (n) =>
  parseFloat(n || 0).toLocaleString('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 });

function DashboardContent() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Client sub-section state
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user && authService.isAuthenticated()) {
      setIsAuthenticated(true);
      setCurrentUser(user);

      if (user.role === 'client' && user.client_id) {
        setSelectedClientId(user.client_id);
      }

      loadMetrics(user.role);
    }
    setLoading(false);
  }, []);

  const loadMetrics = async (role) => {
    try {
      const data = role === 'client'
        ? await dashboardService.getClientMetrics()
        : await dashboardService.getMetrics();
      setMetrics(data);
    } catch (e) {
      console.warn("Failed to load dashboard metrics", e);
    }
  };

  const handleLoginSuccess = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    loadMetrics(user.role);
    if (user.role === 'client' && user.client_id) {
      setSelectedClientId(user.client_id);
      setActiveSection("clients");
    } else {
      setActiveSection("dashboard");
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedClientId(null);
    toast.success("Logged out successfully");
  };

  const setSection = (section) => {
    if (currentUser?.role !== 'client') {
      setSelectedClientId(null);
      setShowClientForm(false);
      setEditingClient(null);
    }
    setActiveSection(section);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="loading-spinner" />
    </div>
  );

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setSection}
        user={currentUser}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavigation
          activeSection={activeSection}
          user={currentUser}
          onLogout={handleLogout}
          onSectionChange={setSection}
        />

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">

            {activeSection === "dashboard" && currentUser?.role !== 'client' && (
              <div className="space-y-8">
                <div className="dashboard-welcome">
                  <h1 className="text-4xl font-extrabold tracking-tight text-primary">Overview</h1>
                  <p className="text-muted-foreground mt-1">
                    System-wide analytics — {currentUser?.role === 'owner' ? 'Global Command' : `Campus ${currentUser?.campus_id}`}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UsersIcon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Schools</p>
                      <p className="text-3xl font-black mt-1">{metrics?.totalClients || 0}</p>
                    </div>
                  </div>
                  <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Collected</p>
                      <p className="text-3xl font-black mt-1 text-emerald-600 truncate">{formatPkr(metrics?.totalPaid)}</p>
                    </div>
                  </div>
                  <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pending Revenue</p>
                      <p className="text-3xl font-black mt-1 text-amber-600 truncate">{formatPkr(metrics?.pendingPayments)}</p>
                    </div>
                  </div>
                  <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <ReceiptIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Contract Volume</p>
                      <p className="text-3xl font-black mt-1 truncate">{formatPkr(metrics?.totalRevenue)}</p>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
                  <div className="lg:col-span-2 bg-card border border-border/50 p-8 rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-bold tracking-tight">Revenue Breakdown</h3>
                        <p className="text-sm text-muted-foreground">Volume distributed by voucher status</p>
                      </div>
                    </div>
                    <DashboardCharts data={metrics?.chartData} type="bar" />
                  </div>
                  <div className="bg-card border border-border/50 p-8 rounded-3xl shadow-sm">
                    <h3 className="text-xl font-bold tracking-tight mb-2 text-center">Payment Mix</h3>
                    <p className="text-sm text-muted-foreground text-center mb-8">Overall collection health</p>
                    <DashboardCharts data={metrics?.chartData} type="pie" />
                  </div>
                </div>
              </div>
            )}

            {activeSection === "dashboard" && currentUser?.role === 'client' && (
              <ClientDetail
                key={currentUser.client_id}
                clientId={currentUser.client_id}
                isClientView={true}
              />
            )}

            {activeSection === "clients" && (
              <div className="clients-container">
                {currentUser?.role === 'client' ? (
                  <ClientDetail
                    key={currentUser.client_id}
                    clientId={currentUser.client_id}
                    isClientView={true}
                  />
                ) : showClientForm || editingClient ? (
                  <ClientForm
                    client={editingClient}
                    onSuccess={() => {
                      toast.success(editingClient ? 'School client updated!' : 'School client registered!');
                      setShowClientForm(false);
                      setEditingClient(null);
                      setRefreshKey(k => k + 1);
                      loadMetrics(currentUser?.role);
                    }}
                    onCancel={() => {
                      setShowClientForm(false);
                      setEditingClient(null);
                    }}
                  />
                ) : selectedClientId ? (
                  <ClientDetail
                    key={selectedClientId}
                    clientId={selectedClientId}
                    onBack={() => setSelectedClientId(null)}
                  />
                ) : (
                  <ClientList
                    key={refreshKey}
                    onAdd={() => {
                      setEditingClient(null);
                      setShowClientForm(true);
                    }}
                    onSelect={(id) => setSelectedClientId(id)}
                    onEdit={(client) => {
                      setEditingClient(client);
                    }}
                  />
                )}
              </div>
            )}

            {activeSection === "vouchers" && (
              <div className="vouchers-container">
                <div className="mb-0">
                  <h1 className="text-4xl font-extrabold tracking-tight text-primary">Financials</h1>
                  <p className="text-muted-foreground mt-1">
                    {currentUser?.role === 'client' ? 'Direct view of your fee records' : 'Unified fee tracking and payments'}
                  </p>
                </div>
                <div className="mt-8">
                  <SchoolVoucherList
                    key={refreshKey}
                    clientId={currentUser?.role === 'client' ? currentUser.client_id : null}
                    isClientView={currentUser?.role === 'client'}
                  />
                </div>
              </div>
            )}

            {activeSection === "campuses" && (
              <div className="campuses-container">
                <div className="mb-8">
                  <h1 className="text-4xl font-extrabold tracking-tight text-primary">Regional Campuses</h1>
                  <p className="text-muted-foreground mt-1">Direct management of physical institutional hubs.</p>
                </div>
                <CampusList />
              </div>
            )}

            {activeSection === "settings" && <Settings user={currentUser} />}

          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DashboardContent />
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
