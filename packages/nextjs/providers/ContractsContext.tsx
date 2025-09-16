"use client";

import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { BrowserProvider, ethers } from "ethers";
import type { Eip1193Provider } from "ethers";
import type { WalletClient } from "viem";
import { useDisconnect, useWalletClient } from "wagmi";
import { XOConnectProvider } from "xo-connect";
import deployedContracts from "~~/contracts/deployedContracts";
import externalContracts from "~~/contracts/externalContracts";
import { useEmbedded } from "~~/providers/EmbeddedContext";
import { getSettings } from "~~/utils/settings";

const SESSION_KEY = "sami_session_address";

interface ContractsContextType {
  /** Asegura conexión y devuelve la address (sin firmar) */
  forceLogin: () => Promise<string>;
  /** Exponer signer/contratos si querés usarlos luego */
  contracts: () => Promise<any>;
  /** Estado de “sesión” en cliente */
  address: string | null;
  isConnected: boolean;
  logout: () => void;
}

interface ContractsProviderProps {
  children: ReactNode;
}

const ContractsContext = createContext<ContractsContextType | null>(null);

function walletClientToEip1193Provider(walletClient: WalletClient): Eip1193Provider {
  return walletClient.transport as Eip1193Provider;
}

export const ContractsProvider: React.FC<ContractsProviderProps> = ({ children }) => {
  const [values, setValues] = useState<any>(null);
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);

  const settings = getSettings();
  const { data: walletClient } = useWalletClient();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  const { isEmbedded } = useEmbedded();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const a = localStorage.getItem(SESSION_KEY);
      if (a) setSessionAddress(a);
    }
  }, []);

  const ensureAccounts = async (provider: any): Promise<string[]> => {
    if (!provider?.request) throw new Error("Provider no implementa EIP-1193");
    let accounts: string[] = await provider.request({ method: "eth_accounts" });
    if (!accounts?.length) {
      // dispara el modal de conexión
      accounts = await provider.request({ method: "eth_requestAccounts" });
    }
    if (!accounts?.length) throw new Error("NoAccountsError");
    return accounts;
  };

  const connectEmbedded = async () => {
    const provider = new XOConnectProvider(); // se asume EIP-1193
    await ensureAccounts(provider);
    return { provider, disconnect: async () => {} };
  };

  const connectNormal = () => {
    if (!walletClient) throw new Error("Wallet client not found");
    const provider = walletClientToEip1193Provider(walletClient);
    const disconnect = async () => {
      wagmiDisconnect();
      setValues(null);
    };
    return { provider, disconnect };
  };

  const contracts = async () => {
    if (values) return values;

    const config = await (await fetch(`${settings.apiDomain}/api/config`)).json();
    const { provider, disconnect } = isEmbedded ? await connectEmbedded() : connectNormal();

    // listeners
    if ("on" in provider && typeof provider.on === "function") {
      provider.on("accountsChanged", async () => {
        await disconnect();
        setValues(null);
        setSessionAddress(null);
        if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
      });
      provider.on("disconnect", () => {
        setValues(null);
        setSessionAddress(null);
        if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
      });
    }

    await ensureAccounts(provider);

    const ethersProvider = new BrowserProvider(provider as any);
    const signer = await ethersProvider.getSigner(0);

    // (Opcional) fuerza red de trabajo:
    // await ensureChain(provider, settings.base.chainId, settings.base.rpcUrl, settings.base.name);

    const samiAddress = config.simpleSamiContractAddress;
    const usdcAddress = config.usdcContractAddress;
    const chainIdD = settings.base.chainId as keyof typeof deployedContracts;
    const chainIdE = settings.base.chainId as keyof typeof externalContracts;

    const samiABI = deployedContracts[chainIdD].USDCSimpleSAMI.abi;
    const usdcABI =
      config.environment === "production"
        ? externalContracts[chainIdE].USDC.abi
        : (deployedContracts[chainIdD] as any)?.USDC?.abi;
    if (!usdcABI) throw new Error(`USDC ABI not found for chain ${chainIdD}`);

    const sami = new ethers.Contract(samiAddress, samiABI, signer);
    const usdc = new ethers.Contract(usdcAddress, usdcABI, signer);
    const connectedAddress = (await signer.getAddress()).toLowerCase();

    const newVals = {
      sami,
      usdc,
      samiAddress,
      usdcAddress,
      signer,
      connectedAddress,
      provider,
      disconnect,
      isEmbedded,
    };
    setValues(newVals);
    return newVals;
  };

  // “Forzar login”: asegura conexión y persiste la address en cliente
  const forceLogin = async (): Promise<string> => {
    const { signer, provider } = await contracts();
    await ensureAccounts(provider);
    const address = (await signer.getAddress()).toLowerCase();

    if (typeof window !== "undefined") localStorage.setItem(SESSION_KEY, address);
    setSessionAddress(address);

    return address;
  };

  const logout = () => {
    setSessionAddress(null);
    if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
  };

  return (
    <ContractsContext.Provider
      value={{
        forceLogin,
        contracts,
        address: sessionAddress,
        isConnected: !!sessionAddress,
        logout,
      }}
    >
      {children}
    </ContractsContext.Provider>
  );
};

export const useContracts = () => {
  const ctx = useContext(ContractsContext);
  if (!ctx) throw new Error("useContracts must be used within a <ContractsProvider>");
  return ctx;
};
