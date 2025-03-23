"use client";

// Required for Next.js
import { ReactNode, useEffect } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Passing appId in the install is optional
    // but allows you to access it later via `window.MiniKit.appId`
    MiniKit.install();
  }, []);

  return <>{children}</>;
}
