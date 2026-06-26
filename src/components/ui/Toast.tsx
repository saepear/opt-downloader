"use client";

import { Toaster as HotToaster, toast as hotToast } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      gutter={8}
      containerClassName="toast-container"
      toastOptions={{
        duration: 3000,
        style: {
          padding: "12px 20px",
          borderRadius: "8px",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: 14,
          fontWeight: 450,
          color: "#f5f5f7",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          maxWidth: 380,
        },
        success: { iconTheme: { primary: "#22d3ee", secondary: "#000" } },
        error: { iconTheme: { primary: "#f87171", secondary: "#000" } },
      }}
    />
  );
}

export const toast = hotToast;
