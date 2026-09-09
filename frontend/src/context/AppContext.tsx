import axios from "axios";
import { createContext, useEffect, useState, type ReactNode } from "react";
import { authService } from "../main";
import { type AppContextType, type User } from "../features/auth/auth.type";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchUser() {
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.get(`${authService}/v1/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      setUser(data.user);
      setIsAuth(true);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // The request updates state asynchronously after the profile response arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUser();
  }, []);

  return <AppContext.Provider value={{isAuth, loading, setIsAuth, setLoading, setUser, user}}>{children}</AppContext.Provider>
}