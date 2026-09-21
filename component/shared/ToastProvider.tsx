"use client";

import { Toaster } from "react-hot-toast";

// One toaster for the whole portal, mounted in the root layout. Anywhere in a
// client component: `import toast from "react-hot-toast"` then `toast.success("…")`.
// It lives above the pages, so a toast stays visible while a redirect happens.
const ToastProvider = () => (
  <Toaster
    position="bottom-right"
    toastOptions={{
      duration: 4000,
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: "#17242f",
        background: "#ffffff",
        border: "1px solid #dbe3de",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(11, 21, 34, 0.12)",
      },
      success: { iconTheme: { primary: "#16a34a", secondary: "#ffffff" } },
      error: { duration: 5000, iconTheme: { primary: "#dc2626", secondary: "#ffffff" } },
    }}
  />
);

export default ToastProvider;
