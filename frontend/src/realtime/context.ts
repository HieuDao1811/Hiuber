import { createContext, useContext } from "react";
import type { RealtimeContextValue } from "./realtime.type";

export const RealtimeContext = createContext<RealtimeContextValue | undefined>(
  undefined,
);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error("useRealtime must be used inside RealtimeProvider");
  return context;
};
