import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { authService } from "../../constants/app";
import { useAuth } from "../../hooks/useAuth";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setIsAuth, setUser } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (password.length < 6) {
      toast.error("Mật khẩu phải từ 6 ký tự trở lên");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${authService}/v1/auth/register`, {
        name: name.trim(),
        email: email.trim(),
        password,
        image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`,
      });

      if (data?.token) localStorage.setItem("token", data.token);
      if (data?.user) setUser(data.user);
      setIsAuth(true);
      toast.success("Đăng ký tài khoản thành công!");
      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Đăng ký không thành công");
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
    onError: () => toast.error("Đăng ký Google không thành công"),
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
          <h1 className="text-xl font-bold text-dark">Tạo tài khoản Hiuber</h1>
          <p className="text-sm text-muted mt-1">Đăng ký nhanh chóng và tiện lợi</p>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={() => googleLogin()}
          disabled={loading}
          className="w-full h-11 flex items-center justify-center gap-2 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition cursor-pointer disabled:opacity-60"
        >
          <FcGoogle className="w-5 h-5" />
          <span>Đăng ký với Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-border" />
          <span className="px-3 text-xs text-muted uppercase">hoặc</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-dark mb-1">
              Họ và tên
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              required
              disabled={loading}
              className="w-full h-11 px-3.5 border border-border rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

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
            <label className="block text-xs font-medium text-dark mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
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

          <div>
            <label className="block text-xs font-medium text-dark mb-1">
              Xác nhận mật khẩu
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              required
              disabled={loading}
              className="w-full h-11 px-3.5 border border-border rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition cursor-pointer disabled:opacity-60 mt-2"
          >
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-muted mt-6">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-brand font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;


