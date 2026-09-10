import { createContext } from "react";
import type { AppContextType } from "../services/auth/auth.type";

export const AppContext = createContext<AppContextType | undefined>(undefined);