"use client";

import { useEffect, useState } from "react";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { WagmiProvider } from "wagmi";
import { BlockieAvatar } from "~~/components/common/BlockieAvatar";
import { Footer } from "~~/components/common/Footer";
import { Header } from "~~/components/common/Header";
import ParticleBackground from "~~/components/common/ParticleBackground";
import { ThemeProvider } from "~~/providers/ThemeProvider";
import { ContractsProvider } from "~~/providers/ContractsContext";
import { EmbeddedProvider } from "~~/providers/EmbeddedContext";
import { SocketProvider } from "~~/providers/SocketContext";
import { wagmiConfig } from "~~/providers/WagmiConfig";
import { Routes, Route } from 'react-router-dom'
import Home from "./views/Home";

const EthApp = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <ParticleBackground />
      <main className="relative flex flex-col flex-1 outline-double">
         <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/not-embedded" element={<Home />} />
            <Route path="/embedded" element={<Home />} />
          </Routes>
        </main>
      <Footer />
      <Toaster />
    </div>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const EthAppWithProviders = () => {
  const { resolvedTheme } = useTheme();
  const isLightMode = resolvedTheme === "light";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme={resolvedTheme}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <EmbeddedProvider>
            <ContractsProvider>
              <SocketProvider>
                <ProgressBar height="3px" color="#2299dd" />
                <ToastContainer position="top-right" />
                <RainbowKitProvider
                  avatar={BlockieAvatar}
                  theme={mounted ? (isLightMode ? lightTheme() : darkTheme()) : darkTheme()}
                >
                  <EthApp/>
                </RainbowKitProvider>
              </SocketProvider>
            </ContractsProvider>
          </EmbeddedProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
};
