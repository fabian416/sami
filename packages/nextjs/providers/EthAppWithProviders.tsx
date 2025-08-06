"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { Footer } from "~~/components/common/Footer";
import { Header } from "~~/components/common/Header";
import ParticleBackground from "~~/components/common/ParticleBackground";
import { ContractsProvider } from "~~/providers/ContractsContext";
import { EmbeddedProvider } from "~~/providers/EmbeddedContext";
import { SocketProvider } from "~~/providers/SocketContext";

const EthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className={`flex flex-col min-h-screen `}>
        <Header />
        <>
          <ParticleBackground />
          <main className="relative flex flex-col flex-1">{children}</main>
          <Footer />
        </>
      </div>
      <Toaster />
    </>
  );
};

export const EthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isLightMode = resolvedTheme === "light";

  return (
    <SocketProvider>
      <EmbeddedProvider>
        <ContractsProvider>
          <ProgressBar height="3px" color="#2299dd" />
          <EthApp>{children}</EthApp>
        </ContractsProvider>
      </EmbeddedProvider>
    </SocketProvider>
  );
};
