import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../main";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const responseGoogle = async(authResult: any) => {
    setLoading(true);
    try {
      const result = await axios.post(`${authService}/v1/auth/google`, { code: authResult["code"] }); 

      localStorage.setItem("token", result.data.token);
      toast.success(result.data.message);
      setLoading(false);
      navigate("/");
    } catch (error) {
       console.error(error);
       toast.error("Problem while login");
       setLoading(false);
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code"
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-3xl font-bold text-[#E23774]">
          Tomato
        </h1>

        <p className="text-center text-sm text-gray-500">
          Log in or sign up to continue
        </p>

        <button onClick={googleLogin} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3"><FcGoogle size={20}></FcGoogle></button>
      </div>
    </div>
  )
}

export default Login;