import axios from "axios";
import { useEffect, useState, type ReactNode } from "react";
import { authService } from "../constants/app";
import { type User } from "../services/auth/auth.type";
import { AppContext } from "./context";

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`${authService}/v1/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (isMounted) {
          setUser(data.data);
          setIsAuth(true);
        }
      } catch (error) {
        console.error(error);
        localStorage.removeItem("token");
        setIsAuth(false);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AppContext.Provider
      value={{ isAuth, loading, setIsAuth, setLoading, setUser, user }}
    >
      {children}
    </AppContext.Provider>
  );
};
