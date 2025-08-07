"use client";

import { useEffect, useState } from "react";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { BlockieAvatar } from "~~/components/common/BlockieAvatar";
import { Footer } from "~~/components/common/Footer";
import { Header } from "~~/components/common/Header";
import ParticleBackground from "~~/components/common/ParticleBackground";
import { ContractsProvider } from "~~/providers/ContractsContext";
import { EmbeddedProvider } from "~~/providers/EmbeddedContext";
import { SocketProvider } from "~~/providers/SocketContext";
import { wagmiConfig } from "~~/providers/WagmiConfig";

const EthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <ParticleBackground />
      <main className="relative flex flex-col flex-1 outline-double">{children}</main>
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

export const EthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isLightMode = resolvedTheme === "light";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <EmbeddedProvider>
          <ContractsProvider>
            <SocketProvider>
              <ProgressBar height="3px" color="#2299dd" />
              <RainbowKitProvider
                avatar={BlockieAvatar}
                theme={mounted ? (isLightMode ? lightTheme() : darkTheme()) : darkTheme()}
              >
                <EthApp>{children}</EthApp>
              </RainbowKitProvider>
            </SocketProvider>
          </ContractsProvider>
        </EmbeddedProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
