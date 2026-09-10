import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { authService } from "../../constants/app";
import { useAuth } from "../../hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setIsAuth, setUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${authService}/v1/auth/login`, {
        email: email.trim(),
        password,
      });

      if (data?.token) localStorage.setItem("token", data.token);
      if (data?.user) setUser(data.user);
      setIsAuth(true);
      toast.success("Đăng nhập thành công!");
      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Email hoặc mật khẩu không đúng");
      } else {
        toast.error("Đã xảy ra lỗi, vui lòng thử lại");
      }
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (authResult) => {
      setLoading(true);
      try {
        const { data } = await axios.post(`${authService}/v1/auth/google`, {
          code: authResult.code,
        });
        const token = data?.data || data?.token;
        if (token) localStorage.setItem("token", token);
        if (data?.user) setUser(data.user);
        setIsAuth(true);
        toast.success("Đăng nhập Google thành công!");
        navigate("/");
      } catch {
        toast.error("Lỗi khi đăng nhập bằng Google");
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error("Đăng nhập Google không thành công"),
    flow: "auth-code",
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand text-white font-bold text-xl mb-3">
            H
          </div>
          <h1 className="text-xl font-bold text-dark">Đăng nhập Hiuber</h1>
          <p className="text-sm text-muted mt-1">Chào mừng bạn quay trở lại</p>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={() => googleLogin()}
          disabled={loading}
          className="w-full h-11 flex items-center justify-center gap-2 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition cursor-pointer disabled:opacity-60"
        >
          <FcGoogle className="w-5 h-5" />
          <span>Tiếp tục với Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-border" />
          <span className="px-3 text-xs text-muted uppercase">hoặc</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-dark mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              disabled={loading}
              className="w-full h-11 px-3.5 border border-border rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-dark">
                Mật khẩu
              </label>
              <span className="text-xs text-brand hover:underline cursor-pointer">
                Quên mật khẩu?
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
                disabled={loading}
                className="w-full h-11 pl-3.5 pr-10 border border-border rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-muted hover:text-dark cursor-pointer"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition cursor-pointer disabled:opacity-60 mt-2"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-muted mt-6">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-brand font-medium hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;



