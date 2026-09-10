import { useContext } from "react";
import { AppContext } from "../context/context";

export const useAuth = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAuth must be used inside AppProvider");
  }

  return context;
};

export const useAppData = useAuth;