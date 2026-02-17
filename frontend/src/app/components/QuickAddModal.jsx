import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "./ui/dialog.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select.jsx";
import { usersService } from "../services/usersService";
import { vouchersService } from "../services/vouchersService";
import { paymentTypesService } from "../services/paymentTypesService";
import { toast } from "sonner";
import { UserPlus, CreditCard, Plus, Loader2 } from "lucide-react";

export function QuickAddModal({ isOpen, onOpenChange, onSuccess }) {
    const [activeTab, setActiveTab] = useState("client");
    const [loading, setLoading] = useState(false);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [clients, setClients] = useState([]);

    // Client State
    const [newClient, setNewClient] = useState({
        fullName: "",
        email: "",
        phone: "",
        role: "client",
        password: "",
        status: "active",
    });

    // Voucher State
    const [newVoucher, setNewVoucher] = useState({
        clientId: "",
        paymentTypeId: "",
        amount: "",
        dueDate: new Date().toISOString().split("T")[0],
        description: "",
        status: "pending",
    });

    useEffect(() => {
        if (isOpen) {
            fetchVoucherOptions();
        }
    }, [isOpen]);

    const fetchVoucherOptions = async () => {
        try {
            const [pts, uData] = await Promise.all([
                paymentTypesService.getAll(),
                usersService.getAll(),
            ]);
            setPaymentTypes(pts);
            setClients(uData.users || []);
        } catch (error) {
            console.error("Failed to fetch voucher options", error);
        }
    };

    const handleCreateClient = async () => {
        if (!newClient.fullName || !newClient.email) {
            toast.error("Please fill in required fields");
            return;
        }
        setLoading(true);
        try {
            await usersService.create(newClient);
            toast.success("Client created successfully");
            setNewClient({
                fullName: "",
                email: "",
                phone: "",
                role: "client",
                password: "",
                status: "active",
            });
            if (onSuccess) onSuccess("client");
            onOpenChange(false);
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to create client");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateVoucher = async () => {
        if (!newVoucher.clientId || !newVoucher.amount || !newVoucher.paymentTypeId) {
            toast.error("Please fill in required fields");
            return;
        }
        setLoading(true);
        try {
            // Use FormData if you want to support attachments later, 
            // but for quick add, a simple object is often enough if the service supports it.
            // Based on previous edits, vouchersService.create expects FormData.
            const formData = new FormData();
            formData.append("clientId", newVoucher.clientId);
            formData.append("paymentTypeId", newVoucher.paymentTypeId);
            formData.append("amount", newVoucher.amount);
            formData.append("dueDate", newVoucher.dueDate);
            formData.append("description", newVoucher.description);
            formData.append("status", newVoucher.status);

            await vouchersService.create(formData);
            toast.success("Voucher created successfully");
            setNewVoucher({
                clientId: "",
                paymentTypeId: "",
                amount: "",
                dueDate: new Date().toISOString().split("T")[0],
                description: "",
                status: "pending",
            });
            if (onSuccess) onSuccess("voucher");
            onOpenChange(false);
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to create voucher");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold dark:text-white flex items-center gap-2">
                        <Plus className="w-6 h-6 text-blue-500" />
                        Quick Creation
                    </DialogTitle>
                    <DialogDescription className="dark:text-gray-400">
                        Create a new client or register a new voucher instantly.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2 dark:bg-gray-800 p-1">
                        <TabsTrigger value="client" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add User
                        </TabsTrigger>
                        <TabsTrigger value="voucher" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Add Voucher
                        </TabsTrigger>
                    </TabsList>

                    {/* Client Tab */}
                    <TabsContent value="client" className="space-y-4 pt-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-300">Full Name *</label>
                                    <Input
                                        placeholder="John Doe"
                                        value={newClient.fullName}
                                        onChange={(e) => setNewClient({ ...newClient, fullName: e.target.value })}
                                        className="dark:bg-gray-850 dark:border-gray-700 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-300">Email *</label>
                                    <Input
                                        type="email"
                                        placeholder="john@example.com"
                                        value={newClient.email}
                                        onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                        className="dark:bg-gray-850 dark:border-gray-700 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-300">Phone</label>
                                    <Input
                                        placeholder="+1 (555) 000-0000"
                                        value={newClient.phone}
                                        onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                        className="dark:bg-gray-850 dark:border-gray-700 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-300">Role</label>
                                    <Select
                                        value={newClient.role}
                                        onValueChange={(val) => setNewClient({ ...newClient, role: val })}
                                    >
                                        <SelectTrigger className="dark:bg-gray-850 dark:border-gray-700 dark:text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-gray-800 border-gray-700">
                                            <SelectItem value="client">Client</SelectItem>
                                            <SelectItem value="accountant">Accountant</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-300">Password</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={newClient.password}
                                        onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                                        className="dark:bg-gray-850 dark:border-gray-700 dark:text-white"
                                    />
                                    <p className="text-[10px] text-gray-500">Required if role is Accountant</p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button
                                onClick={handleCreateClient}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Create User
                            </Button>
                        </DialogFooter>
                    </TabsContent>

                    {/* Voucher Tab */}
                    <TabsContent value="voucher" className="space-y-4 pt-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-medium dark:text-gray-300">Client *</label>
                                    <Select
                                        value={newVoucher.clientId}
                                        onValueChange={(val) => setNewVoucher({ ...newVoucher, clientId: val })}
                                    >
                                        <SelectTrigger className="dark:bg-gray-850 dark:border-gray-700 dark:text-white">
                                            <SelectValue placeholder="Select client" />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-gray-800 border-gray-700">
                                            {clients.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.fullName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-300">Payment Type *</label>
                                    <Select
                                        value={newVoucher.paymentTypeId}
                                        onValueChange={(val) => setNewVoucher({ ...newVoucher, paymentTypeId: val })}
                                    >
                                        <SelectTrigger className="dark:bg-gray-850 dark:border-gray-700 dark:text-white">
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-gray-800 border-gray-700">
                                            {paymentTypes.map((pt) => (
                                                <SelectItem key={pt.id} value={String(pt.id)}>
                                                    {pt.type_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-300">Amount *</label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={newVoucher.amount}
                                        onChange={(e) => setNewVoucher({ ...newVoucher, amount: e.target.value })}
                                        className="dark:bg-gray-850 dark:border-gray-700 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-300">Due Date</label>
                                    <Input
                                        type="date"
                                        value={newVoucher.dueDate}
                                        onChange={(e) => setNewVoucher({ ...newVoucher, dueDate: e.target.value })}
                                        className="dark:bg-gray-850 dark:border-gray-700 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-300">Status</label>
                                    <Select
                                        value={newVoucher.status}
                                        onValueChange={(val) => setNewVoucher({ ...newVoucher, status: val })}
                                    >
                                        <SelectTrigger className="dark:bg-gray-850 dark:border-gray-700 dark:text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-gray-800 border-gray-700">
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="overdue">Overdue</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button
                                onClick={handleCreateVoucher}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Create Voucher
                            </Button>
                        </DialogFooter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
