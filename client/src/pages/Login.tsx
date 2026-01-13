import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import request from "@/utils/request";
import { setToken } from "@/utils/auth";

/**
 * Modern Minimalist Login Page
 * Design Philosophy: Contemporary Minimalism with Glassmorphism
 * - Deep charcoal background with teal accent (#06B6D4)
 * - Asymmetric split layout with frosted glass card
 * - Smooth micro-interactions and animations
 * - Typography: Poppins for headings, Inter for body
 */

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // 调用后端登录接口
      console.log(email, password);
      const res = await request.post("/login", { email, password });
      if (res.code === 200) {
        // 存储Token和有效期
        setToken(res.data.access_token, res.data.expires_in);
        // 提示并跳转仪表盘
        toast.success("登录成功，跳转中...");
        setTimeout(() => {
          // 跳转仪表盘
        }, 500);
        // 重置表单
        setEmail("");
        setPassword("");
      } else {
        toast.error(res.msg || "登录失败");
      }
    } catch (error: any) {
      // 处理后端返回的错误（如账号密码错误）
      const errorMsg = error.response?.data?.msg || "网络错误，请重试";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/login-bg-gradient.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-slate-900/40 via-transparent to-slate-900/40 pointer-events-none" />

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Card with glassmorphism effect */}
        <Card className="backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 shadow-2xl">
          <div className="p-8 sm:p-10">
            {/* Header */}
            <div className="mb-8">
              <h1
                className="text-3xl font-bold text-white mb-2"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Welcome Back
              </h1>
              <p className="text-slate-400 text-sm">登录您的帐户以继续</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-slate-300 text-sm font-medium"
                >
                  电子邮件
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (errors.email)
                        setErrors({ ...errors, email: undefined });
                    }}
                    className={`pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 transition-all duration-300 ${
                      errors.email ? "border-red-500/50" : ""
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-slate-300 text-sm font-medium"
                >
                  密码
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (errors.password)
                        setErrors({ ...errors, password: undefined });
                    }}
                    className={`pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 transition-all duration-300 ${
                      errors.password ? "border-red-500/50" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2.5 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    登录中...
                  </>
                ) : (
                  "登 录"
                )}
              </Button>
            </form>
          </div>
        </Card>

        {/* Footer text */}
        <p className="text-center text-slate-500 text-xs mt-6"></p>
      </div>
    </div>
  );
}
