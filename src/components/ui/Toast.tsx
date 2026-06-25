"use client";

import { Toaster as HotToaster, toast as hotToast } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "rgba(20, 20, 25, 0.95)",
          color: "#ededed",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "12px",
          backdropFilter: "blur(8px)",
        },
        success: { iconTheme: { primary: "#22d3ee", secondary: "#000" } },
        error: { iconTheme: { primary: "#f87171", secondary: "#000" } },
      }}
    />
  );
}

export const toast = hotToast;