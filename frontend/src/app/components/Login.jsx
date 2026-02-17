import React, { useState } from "react";
import { authService } from "../services/authService";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card.jsx";
import { toast } from "sonner";
import { ShieldCheck, Lock, User, Eye, EyeOff } from "lucide-react";

export function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      toast.success("Login successful!");
      onLoginSuccess(data.user);
    } catch (error) {
      toast.error(error.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fbff] dark:bg-gray-950 p-4 font-sans">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-none rounded-[20px] p-2">
        <CardHeader className="text-center space-y-2 pt-8">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-9 h-9 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white pt-2">System Login</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400 text-lg">
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  type="email"
                  placeholder="Enter username"
                  className="pl-12 h-12 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-blue-400 transition-all text-gray-800 dark:text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="pl-12 pr-12 h-12 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-blue-400 transition-all text-gray-800 dark:text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 flex items-center justify-center gap-2 mt-4"
              disabled={loading}
            >
              <Lock className="w-5 h-5" />
              {loading ? "Authenticating..." : "Login"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Default credentials: <span className="font-medium">admin / admin123</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
