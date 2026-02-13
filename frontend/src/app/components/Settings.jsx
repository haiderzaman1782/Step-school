import React, { useState } from "react";
import { 
  Save, 
  RotateCcw, 
  Globe, 
  Building2, 
  Calendar, 
  Bell,
  Upload,
  X,
  Plus,
  Trash2,
  Clock,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select.jsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";
import { toast } from "sonner";
import { cn } from "./ui/utils.js";

export function Settings() {
  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    applicationName: "AI Booking Voice System",
    logo: null,
    logoPreview: null,
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    language: "en",
    theme: "system"
  });

  // Business Settings State
  const [businessSettings, setBusinessSettings] = useState({
    businessName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    contactEmail: "",
    contactPhone: "",
    workingDays: {
      monday: { enabled: true, start: "09:00", end: "17:00" },
      tuesday: { enabled: true, start: "09:00", end: "17:00" },
      wednesday: { enabled: true, start: "09:00", end: "17:00" },
      thursday: { enabled: true, start: "09:00", end: "17:00" },
      friday: { enabled: true, start: "09:00", end: "17:00" },
      saturday: { enabled: false, start: "09:00", end: "17:00" },
      sunday: { enabled: false, start: "09:00", end: "17:00" }
    },
    holidays: [],
    services: [
      { id: 1, name: "Consultation", duration: 30, price: 100 },
      { id: 2, name: "Follow-up", duration: 15, price: 50 }
    ]
  });

  // Appointment Settings State
  const [appointmentSettings, setAppointmentSettings] = useState({
    slotDuration: 30,
    bufferTime: 15,
    maxAppointmentsPerDay: 20,
    autoConfirm: false,
    cancellationRules: {
      allowCancellation: true,
      cancellationDeadline: 24, // hours
      allowReschedule: true,
      rescheduleDeadline: 24 // hours
    }
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    smsEnabled: false,
    whatsappEnabled: false,
    notifyNewAppointments: true,
    notifyCancellations: true,
    notifyPaymentUpdates: true,
    notifyMissedCalls: true
  });

  // UI State
  const [activeTab, setActiveTab] = useState("general");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [newHoliday, setNewHoliday] = useState({ name: "", date: "" });
  const [showHolidayDialog, setShowHolidayDialog] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [newService, setNewService] = useState({ name: "", duration: 30, price: 0 });

  // Default values for reset
  const defaultGeneralSettings = {
    applicationName: "AI Booking Voice System",
    logo: null,
    logoPreview: null,
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    language: "en",
    theme: "system"
  };

  const defaultBusinessSettings = {
    businessName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    contactEmail: "",
    contactPhone: "",
    workingDays: {
      monday: { enabled: true, start: "09:00", end: "17:00" },
      tuesday: { enabled: true, start: "09:00", end: "17:00" },
      wednesday: { enabled: true, start: "09:00", end: "17:00" },
      thursday: { enabled: true, start: "09:00", end: "17:00" },
      friday: { enabled: true, start: "09:00", end: "17:00" },
      saturday: { enabled: false, start: "09:00", end: "17:00" },
      sunday: { enabled: false, start: "09:00", end: "17:00" }
    },
    holidays: [],
    services: [
      { id: 1, name: "Consultation", duration: 30, price: 100 },
      { id: 2, name: "Follow-up", duration: 15, price: 50 }
    ]
  };

  const defaultAppointmentSettings = {
    slotDuration: 30,
    bufferTime: 15,
    maxAppointmentsPerDay: 20,
    autoConfirm: false,
    cancellationRules: {
      allowCancellation: true,
      cancellationDeadline: 24,
      allowReschedule: true,
      rescheduleDeadline: 24
    }
  };

  const defaultNotificationSettings = {
    emailEnabled: true,
    smsEnabled: false,
    whatsappEnabled: false,
    notifyNewAppointments: true,
    notifyCancellations: true,
    notifyPaymentUpdates: true,
    notifyMissedCalls: true
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    // Business settings validation
    if (!businessSettings.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }
    if (!businessSettings.contactEmail.trim()) {
      newErrors.contactEmail = "Contact email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessSettings.contactEmail)) {
      newErrors.contactEmail = "Invalid email format";
    }
    if (!businessSettings.contactPhone.trim()) {
      newErrors.contactPhone = "Contact phone is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo file is too large. Maximum size is 2MB.");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setGeneralSettings({
          ...generalSettings,
          logo: file,
          logoPreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving.");
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully!", {
        description: "All changes have been applied.",
        duration: 3000,
      });
      setErrors({});
    } catch (error) {
      toast.error("Failed to save settings", {
        description: "Please try again later.",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setGeneralSettings(defaultGeneralSettings);
    setBusinessSettings(defaultBusinessSettings);
    setAppointmentSettings(defaultAppointmentSettings);
    setNotificationSettings(defaultNotificationSettings);
    setErrors({});
    setShowResetDialog(false);
    toast.success("Settings reset to default values", {
      description: "All settings have been restored.",
      duration: 3000,
    });
  };

  // Add holiday
  const handleAddHoliday = () => {
    if (!newHoliday.name || !newHoliday.date) {
      toast.error("Please fill in both holiday name and date.");
      return;
    }
    setBusinessSettings({
      ...businessSettings,
      holidays: [...businessSettings.holidays, { ...newHoliday, id: Date.now() }]
    });
    setNewHoliday({ name: "", date: "" });
    setShowHolidayDialog(false);
    toast.success("Holiday added successfully");
  };

  // Remove holiday
  const handleRemoveHoliday = (id) => {
    setBusinessSettings({
      ...businessSettings,
      holidays: businessSettings.holidays.filter(h => h.id !== id)
    });
    toast.success("Holiday removed");
  };

  // Add service
  const handleAddService = () => {
    if (!newService.name || newService.duration <= 0 || newService.price < 0) {
      toast.error("Please fill in all service details correctly.");
      return;
    }
    setBusinessSettings({
      ...businessSettings,
      services: [...businessSettings.services, { ...newService, id: Date.now() }]
    });
    setNewService({ name: "", duration: 30, price: 0 });
    setEditingService(null);
    toast.success("Service added successfully");
  };

  // Update service
  const handleUpdateService = () => {
    if (!editingService.name || editingService.duration <= 0 || editingService.price < 0) {
      toast.error("Please fill in all service details correctly.");
      return;
    }
    setBusinessSettings({
      ...businessSettings,
      services: businessSettings.services.map(s => 
        s.id === editingService.id ? editingService : s
      )
    });
    setEditingService(null);
    toast.success("Service updated successfully");
  };

  // Remove service
  const handleRemoveService = (id) => {
    setBusinessSettings({
      ...businessSettings,
      services: businessSettings.services.filter(s => s.id !== id)
    });
    toast.success("Service removed");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Configure your system preferences and business information.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowResetDialog(true)}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Appointments</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4 sm:space-y-6">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 rounded-xl shadow-md dark:shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">General Settings</CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure application name, logo, timezone, and display preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Application Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Application Name
                </label>
                <Input
                  value={generalSettings.applicationName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, applicationName: e.target.value })}
                  placeholder="Enter application name"
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Logo
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {generalSettings.logoPreview ? (
                    <div className="relative">
                      <img
                        src={generalSettings.logoPreview}
                        alt="Logo preview"
                        className="w-24 h-24 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2"
                      />
                      <button
                        onClick={() => setGeneralSettings({ ...generalSettings, logo: null, logoPreview: null })}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button variant="outline" asChild>
                        <span className="gap-2">
                          <Upload className="w-4 h-4" />
                          Upload Logo
                        </span>
                      </Button>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Recommended: 200x200px, max 2MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Timezone
                </label>
                <Select
                  value={generalSettings.timezone}
                  onValueChange={(value) => setGeneralSettings({ ...generalSettings, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date Format
                  </label>
                  <Select
                    value={generalSettings.dateFormat}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Time Format
                  </label>
                  <Select
                    value={generalSettings.timeFormat}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, timeFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Language
                </label>
                <Select
                  value={generalSettings.language}
                  onValueChange={(value) => setGeneralSettings({ ...generalSettings, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theme Toggle */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Theme
                </label>
                <div className="flex items-center gap-4">
                  <ThemeToggle />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Toggle between light and dark mode
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-4 sm:space-y-6">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 rounded-xl shadow-md dark:shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Business Information</CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure your business or clinic details and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Business Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business/Clinic Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={businessSettings.businessName}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, businessName: e.target.value })}
                  placeholder="Enter business name"
                  className={errors.businessName ? "border-red-500" : ""}
                />
                {errors.businessName && (
                  <p className="text-xs text-red-500">{errors.businessName}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                <Input
                  value={businessSettings.address}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
                  placeholder="Street address"
                  className="mb-2"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    value={businessSettings.city}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, city: e.target.value })}
                    placeholder="City"
                  />
                  <Input
                    value={businessSettings.state}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, state: e.target.value })}
                    placeholder="State"
                  />
                  <Input
                    value={businessSettings.zipCode}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, zipCode: e.target.value })}
                    placeholder="ZIP Code"
                  />
                </div>
                <Select
                  value={businessSettings.country}
                  onValueChange={(value) => setBusinessSettings({ ...businessSettings, country: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={businessSettings.contactEmail}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, contactEmail: e.target.value })}
                    placeholder="contact@example.com"
                    className={errors.contactEmail ? "border-red-500" : ""}
                  />
                  {errors.contactEmail && (
                    <p className="text-xs text-red-500">{errors.contactEmail}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contact Phone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={businessSettings.contactPhone}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, contactPhone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className={errors.contactPhone ? "border-red-500" : ""}
                  />
                  {errors.contactPhone && (
                    <p className="text-xs text-red-500">{errors.contactPhone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 rounded-xl shadow-md dark:shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Working Hours</CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Set your business operating hours for each day of the week.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(businessSettings.workingDays).map(([day, config]) => (
                <div key={day} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => setBusinessSettings({
                        ...businessSettings,
                        workingDays: {
                          ...businessSettings.workingDays,
                          [day]: { ...config, enabled: e.target.checked }
                        }
                      })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {day}
                    </label>
                  </div>
                  {config.enabled && (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={config.start}
                        onChange={(e) => setBusinessSettings({
                          ...businessSettings,
                          workingDays: {
                            ...businessSettings.workingDays,
                            [day]: { ...config, start: e.target.value }
                          }
                        })}
                        className="flex-1"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="time"
                        value={config.end}
                        onChange={(e) => setBusinessSettings({
                          ...businessSettings,
                          workingDays: {
                            ...businessSettings.workingDays,
                            [day]: { ...config, end: e.target.value }
                          }
                        })}
                        className="flex-1"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Holidays */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 rounded-xl shadow-md dark:shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Holidays</CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage holidays when your business is closed.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHolidayDialog(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Holiday
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {businessSettings.holidays.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No holidays configured</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {businessSettings.holidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{holiday.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(holiday.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveHoliday(holiday.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 rounded-xl shadow-md dark:shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Services</CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage your service offerings with duration and pricing.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewService({ name: "", duration: 30, price: 0 });
                    setEditingService(null);
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {businessSettings.services.map((service) => (
                  <div
                    key={service.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Service Name</label>
                        <Input
                          value={service.name}
                          onChange={(e) => {
                            const updated = businessSettings.services.map(s =>
                              s.id === service.id ? { ...s, name: e.target.value } : s
                            );
                            setBusinessSettings({ ...businessSettings, services: updated });
                          }}
                          placeholder="Service name"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Duration (minutes)</label>
                        <Input
                          type="number"
                          value={service.duration}
                          onChange={(e) => {
                            const updated = businessSettings.services.map(s =>
                              s.id === service.id ? { ...s, duration: parseInt(e.target.value) || 0 } : s
                            );
                            setBusinessSettings({ ...businessSettings, services: updated });
                          }}
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Price ($)</label>
                        <Input
                          type="number"
                          value={service.price}
                          onChange={(e) => {
                            const updated = businessSettings.services.map(s =>
                              s.id === service.id ? { ...s, price: parseFloat(e.target.value) || 0 } : s
                            );
                            setBusinessSettings({ ...businessSettings, services: updated });
                          }}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveService(service.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointment Settings */}
        <TabsContent value="appointments" className="space-y-4 sm:space-y-6">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 rounded-xl shadow-md dark:shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Appointment Configuration</CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure appointment scheduling rules and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Slot Duration */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Slot Duration (minutes)
                </label>
                <Input
                  type="number"
                  value={appointmentSettings.slotDuration}
                  onChange={(e) => setAppointmentSettings({
                    ...appointmentSettings,
                    slotDuration: parseInt(e.target.value) || 30
                  })}
                  min="5"
                  step="5"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Standard duration for each appointment slot
                </p>
              </div>

              {/* Buffer Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Buffer Time Between Appointments (minutes)
                </label>
                <Input
                  type="number"
                  value={appointmentSettings.bufferTime}
                  onChange={(e) => setAppointmentSettings({
                    ...appointmentSettings,
                    bufferTime: parseInt(e.target.value) || 15
                  })}
                  min="0"
                  step="5"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Time gap between consecutive appointments
                </p>
              </div>

              {/* Max Appointments */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Maximum Appointments Per Day
                </label>
                <Input
                  type="number"
                  value={appointmentSettings.maxAppointmentsPerDay}
                  onChange={(e) => setAppointmentSettings({
                    ...appointmentSettings,
                    maxAppointmentsPerDay: parseInt(e.target.value) || 20
                  })}
                  min="1"
                />
              </div>

              {/* Auto-Confirm Toggle */}
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-Confirm Appointments
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Automatically confirm appointments without manual approval
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appointmentSettings.autoConfirm}
                    onChange={(e) => setAppointmentSettings({
                      ...appointmentSettings,
                      autoConfirm: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-teal-400"></div>
                </label>
              </div>

              {/* Cancellation Rules */}
              <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Cancellation & Reschedule Rules
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Allow Cancellations
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Enable appointment cancellations
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appointmentSettings.cancellationRules.allowCancellation}
                        onChange={(e) => setAppointmentSettings({
                          ...appointmentSettings,
                          cancellationRules: {
                            ...appointmentSettings.cancellationRules,
                            allowCancellation: e.target.checked
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-teal-400"></div>
                    </label>
                  </div>

                  {appointmentSettings.cancellationRules.allowCancellation && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Cancellation Deadline (hours before appointment)
                      </label>
                      <Input
                        type="number"
                        value={appointmentSettings.cancellationRules.cancellationDeadline}
                        onChange={(e) => setAppointmentSettings({
                          ...appointmentSettings,
                          cancellationRules: {
                            ...appointmentSettings.cancellationRules,
                            cancellationDeadline: parseInt(e.target.value) || 24
                          }
                        })}
                        min="1"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Allow Rescheduling
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Enable appointment rescheduling
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appointmentSettings.cancellationRules.allowReschedule}
                        onChange={(e) => setAppointmentSettings({
                          ...appointmentSettings,
                          cancellationRules: {
                            ...appointmentSettings.cancellationRules,
                            allowReschedule: e.target.checked
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-teal-400"></div>
                    </label>
                  </div>

                  {appointmentSettings.cancellationRules.allowReschedule && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reschedule Deadline (hours before appointment)
                      </label>
                      <Input
                        type="number"
                        value={appointmentSettings.cancellationRules.rescheduleDeadline}
                        onChange={(e) => setAppointmentSettings({
                          ...appointmentSettings,
                          cancellationRules: {
                            ...appointmentSettings.cancellationRules,
                            rescheduleDeadline: parseInt(e.target.value) || 24
                          }
                        })}
                        min="1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4 sm:space-y-6">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 rounded-xl shadow-md dark:shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure how you receive notifications for various events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Channels */}
              <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Notification Channels
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Notifications
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Receive notifications via email
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailEnabled}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          emailEnabled: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-teal-400"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        SMS Notifications
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsEnabled}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          smsEnabled: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-teal-400"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        WhatsApp Notifications
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Receive notifications via WhatsApp
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.whatsappEnabled}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          whatsappEnabled: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-teal-400"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Notification Types */}
              <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Notification Types
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        New Appointments
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Notify when a new appointment is booked
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.notifyNewAppointments}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          notifyNewAppointments: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-teal-400"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Appointment Cancellations
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Notify when an appointment is cancelled
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.notifyCancellations}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          notifyCancellations: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-teal-400"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Payment Updates
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Notify when payment status changes
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.notifyPaymentUpdates}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          notifyPaymentUpdates: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-teal-400"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Missed Calls
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Notify when a call is missed
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.notifyMissedCalls}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          notifyMissedCalls: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-teal-400"></div>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Settings to Default</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all settings to their default values? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
            >
              Reset Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Holiday Dialog */}
      <Dialog open={showHolidayDialog} onOpenChange={setShowHolidayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
            <DialogDescription>
              Add a holiday when your business will be closed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Holiday Name
              </label>
              <Input
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                placeholder="e.g., New Year's Day"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
              </label>
              <Input
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowHolidayDialog(false);
                setNewHoliday({ name: "", date: "" });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddHoliday}>
              Add Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

