import axios from "axios";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../main";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiTruck,
  FiPackage,
  FiClock,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      const result = await axios.post(`${authService}/v1/auth/login`, {
        email: email.trim(),
        password,
      });

      localStorage.setItem("token", result.data.token);
      toast.success(result.data.message || "Welcome back to Hiuber!");
      navigate("/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Invalid email or password",
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Login
  const responseGoogle = async (authResult: { code: string }) => {
    setLoading(true);

    try {
      const result = await axios.post(`${authService}/v1/auth/google`, {
        code: authResult.code,
      });

      localStorage.setItem("token", result.data.data);
      toast.success("Google sign-in successful!");
      navigate("/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error || "Problem while logging in with Google",
        );
      } else {
        toast.error("Problem while logging in with Google");
      }
    } finally {
      setLoading(false);
    }
  };

  const errorGoogle = () => {
    toast.error("Problem while logging in with Google");
    setLoading(false);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: errorGoogle,
    flow: "auth-code",
  });

  return (
    <div className="min-h-screen w-full bg-[#F9F2ED] font-['Sora',sans-serif] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Import Sora Font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap"
      />

      {/* Main Container Card */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-[0_20px_50px_rgba(49,49,49,0.08)] border border-[#E3E3E3]/60 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        {/* Left Side: Brand Visual & Delivery Aesthetic */}
        <div className="lg:col-span-5 bg-[#313131] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Background Warm Glow & Shapes */}
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-[#C67C4E]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-[#C67C4E]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Tag */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-6 h-6 rounded-full bg-[#C67C4E] flex items-center justify-center text-white text-xs">
                <FiTruck className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold tracking-wider uppercase text-[#EDD6C8]">
                Hiuber Delivery
              </span>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl sm:text-3xl font-bold leading-snug tracking-tight">
                Swift Delivery at Your{" "}
                <span className="text-[#C67C4E]">Doorstep!</span>
              </h2>
              <p className="mt-3 text-sm text-[#E3E3E3]/80 leading-relaxed font-light">
                Order your favorite food, drinks, and daily essentials with
                lightning-fast delivery in minutes.
              </p>
            </div>
          </div>

          {/* Delivery Feature Highlights Card */}
          <div className="relative z-10 my-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#C67C4E]/20 text-[#C67C4E] flex items-center justify-center">
                  <FiClock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    Ultra-Fast 20-Min Delivery
                  </h4>
                  <p className="text-[11px] text-[#E3E3E3]/70">
                    Live real-time driver tracking
                  </p>
                </div>
              </div>
              <div className="h-px bg-white/10 w-full" />
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#EDD6C8] font-medium">
                  <FiPackage className="w-3.5 h-3.5" />
                  <span>First Order Promo</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-[#C67C4E] text-[10px] font-bold text-white tracking-wide uppercase">
                  FREE Delivery
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="relative z-10 text-xs text-[#E3E3E3]/60 flex items-center justify-between">
            <span>© {new Date().getFullYear()} Hiuber Inc.</span>
            <span className="text-[#EDD6C8]/80 font-medium">
              Fast & Reliable
            </span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-[#C67C4E]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#C67C4E]">
                  Hiuber Sign In
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#313131] tracking-tight">
                Welcome Back
              </h1>
              <p className="mt-1.5 text-sm text-[#313131]/65">
                Sign in to track orders, manage deliveries, and unlock deals.
              </p>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={googleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-[#E3E3E3] bg-[#F9F2ED]/40 hover:bg-[#F9F2ED] text-[#313131] text-sm font-semibold transition-all duration-200 hover:border-[#EDD6C8] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C67C4E]/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FcGoogle className="w-5 h-5 shrink-0" />
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-[#E3E3E3]" />
              <span className="absolute bg-white px-3 text-xs font-medium text-[#313131]/50 uppercase tracking-wider">
                Or with email
              </span>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-[#313131] uppercase tracking-wider"
                >
                  Email Address
                </label>
                <div className="relative rounded-2xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#313131]/40">
                    <FiMail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#F9F2ED]/30 border border-[#E3E3E3] rounded-2xl text-sm text-[#313131] placeholder-[#313131]/40 outline-none transition-all duration-200 focus:bg-white focus:border-[#C67C4E] focus:ring-2 focus:ring-[#C67C4E]/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-[#313131] uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      toast(
                        "Please contact support or check your email to reset your password.",
                        { icon: "ℹ️" },
                      )
                    }
                    className="text-xs font-medium text-[#C67C4E] hover:underline cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative rounded-2xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#313131]/40">
                    <FiLock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full pl-10 pr-11 py-3 bg-[#F9F2ED]/30 border border-[#E3E3E3] rounded-2xl text-sm text-[#313131] placeholder-[#313131]/40 outline-none transition-all duration-200 focus:bg-white focus:border-[#C67C4E] focus:ring-2 focus:ring-[#C67C4E]/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={0}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#313131]/50 hover:text-[#313131] transition-colors focus:outline-none cursor-pointer"
                  >
                    {showPassword ? (
                      <FiEyeOff className="w-4 h-4" />
                    ) : (
                      <FiEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 text-xs text-[#313131]/80 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-4 h-4 rounded-md border border-[#E3E3E3] peer-checked:bg-[#C67C4E] peer-checked:border-[#C67C4E] peer-focus:ring-2 peer-focus:ring-[#C67C4E]/20 flex items-center justify-center transition-colors">
                    {rememberMe && (
                      <FiCheck className="w-3 h-3 text-white stroke-[3]" />
                    )}
                  </div>
                  <span>Remember my preferences</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#C67C4E] hover:bg-[#B56A3C] active:bg-[#A35D33] text-white text-sm font-semibold tracking-wide shadow-[0_4px_16px_rgba(198,124,78,0.28)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C67C4E]/40 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Sign-up Redirect Prompt */}
            <div className="pt-2 text-center text-xs text-[#313131]/70">
              <span>Don't have a Hiuber account? </span>
              <Link
                to="/login"
                onClick={(e) => {
                  e.preventDefault();
                  toast(
                    "Sign-up is available with Google or standard credentials.",
                    { icon: "📦" },
                  );
                }}
                className="font-semibold text-[#C67C4E] hover:underline cursor-pointer"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
