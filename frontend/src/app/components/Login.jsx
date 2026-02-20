import React, { useState } from "react";
import { authService } from "../services/authService";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card.jsx";
import { toast } from "sonner";
import { ShieldCheck, Lock, User, Eye, EyeOff, Sparkles, Building2 } from "lucide-react";

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
      toast.success("Welcome Back!");
      onLoginSuccess(data.user);
    } catch (error) {
      toast.error(error.response?.data?.error || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans animate-in fade-in duration-1000">
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none overflow-hidden">
        <Building2 className="absolute -top-10 -left-10 w-64 h-64 rotate-12" />
        <Sparkles className="absolute top-1/4 right-0 w-32 h-32 -rotate-12" />
      </div>

      <div className="w-full max-w-lg bg-card border border-border/50 shadow-2xl rounded-[3rem] p-4 relative z-10">
        <div className="pt-12 pb-8 text-center space-y-3">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center border border-primary/10 shadow-sm animate-pulse-subtle">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">Portal Access</h1>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-[0.2em] opacity-60">Step School Management System</p>
        </div>

        <div className="px-10 pb-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Email Address</label>
              <div className="relative group">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  placeholder="name@stepschool.edu"
                  className="w-full pl-14 pr-6 py-4 bg-muted/5 border border-border/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all font-medium outline-none placeholder:text-muted-foreground/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Secure Key</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-14 pr-14 py-4 bg-muted/5 border border-border/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all font-medium outline-none placeholder:text-muted-foreground/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-5 bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Authorize Entry"}
              {!loading && <Lock className="w-4 h-4 opacity-50" />}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-border/10 text-center">
            <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground opacity-40 uppercase">
              Authenticated Access Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
