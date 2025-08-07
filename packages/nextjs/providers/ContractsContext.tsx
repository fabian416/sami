import React, { ReactNode, createContext, useContext, useState } from "react";
import { ethers } from "ethers";
import { BrowserProvider } from "ethers";
import type { Eip1193Provider } from "ethers";
import type { WalletClient } from "viem";
import { useAccount, useDisconnect, useWalletClient } from "wagmi";
import { Client, XOConnectProvider } from "xo-connect";
import deployedContracts from "~~/contracts/deployedContracts";
import externalContracts from "~~/contracts/externalContracts";
import { getSettings } from "~~/utils/settings";

// Define types for context value and provider props
interface ContractsContextType {
  contracts: (isEmbedded: boolean) => Promise<any>;
  signLoginMessage: (isEmbedded: boolean, message?: string, expectedSigner?: string | null) => Promise<any>;
}

interface ContractsProviderProps {
  children: ReactNode; // Define children prop type
}

const ContractsContext = createContext<ContractsContextType | null>(null);

function walletClientToEip1193Provider(walletClient: WalletClient): Eip1193Provider {
  return walletClient.transport as Eip1193Provider;
}

export const ContractsProvider: React.FC<ContractsProviderProps> = ({ children }) => {
  const [values, setValues] = useState<any>(null);
  const settings = getSettings();
  const { data: walletClient } = useWalletClient();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  const contracts = async (isEmbedded: boolean) => {
    if (values) {
      return values;
    }

    const config = await (await fetch(`${settings.apiDomain}/api/config`)).json();

    const connectEmbedded = (): { provider: XOConnectProvider; disconnect: () => Promise<void> } => {
      return {
        provider: new XOConnectProvider(),
        disconnect: async () => {},
      };
    };

    const connectNormal = (): { provider: Eip1193Provider; disconnect: () => Promise<void> } => {
      if (!walletClient) throw new Error("Wallet client not found");

      const provider = walletClientToEip1193Provider(walletClient);
      const disconnect = async () => {
        wagmiDisconnect();
        setValues(null);
      };

      return { provider, disconnect };
    };

    const { provider, disconnect } = isEmbedded ? connectEmbedded() : connectNormal();

    if ("on" in provider && typeof provider.on === "function") {
      provider.on("accountsChanged", async () => {
        await disconnect();
        setValues(null);
      });
      provider.on("disconnect", () => {
        setValues(null);
      });
    }

    const ethersProvider = new BrowserProvider(provider);
    const signer = await ethersProvider.getSigner(0);

    const samiAddress = config.simpleSamiContractAddress;
    const usdcAddress = config.usdcContractAddress;
    const chainIdD = settings.base.chainId as keyof typeof deployedContracts;
    const chainIdE = settings.base.chainId as keyof typeof externalContracts;

    const samiABI = deployedContracts[chainIdD].USDCSimpleSAMI.abi;
    const usdcABI =
      config.environment === "production"
        ? externalContracts[chainIdE].USDC.abi
        : (deployedContracts[chainIdD] as any)?.USDC?.abi;
    if (!usdcABI) {
      throw new Error(`USDC ABI not found for chain ${chainIdD}`);
    }

    const sami = new ethers.Contract(samiAddress, samiABI, signer);
    const usdc = new ethers.Contract(usdcAddress, usdcABI, signer);
    const connectedAddress = await signer.getAddress();

    const newVals = {
      sami,
      usdc,
      samiAddress,
      usdcAddress,
      signer,
      connectedAddress,
      provider,
      disconnect,
    };
    setValues(newVals);
    return newVals;
  };

  const signLoginMessage = async (isEmbedded: boolean, message = "Login to Sami") => {
    try {
      const { signer, provider } = await contracts(isEmbedded);
      const address = await signer.getAddress();
      const typedData = {
        domain: {
          name: "Sami",
          version: "1",
          chainId: settings.base.chainId,
        },
        message: {
          content: message,
        },
        primaryType: "Acceptance",
        types: {
          EIP712Domain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
          ],
          Acceptance: [{ name: "content", type: "string" }],
        },
      };

      if (provider.isWalletConnect) {
        const sessions = provider.signer.client.session.getAll();
        const session = sessions[sessions.length - 1];
        return await provider.signer.client.request({
          topic: session.topic,
          chainId: `eip155:${settings.base.chainId}`,
          request: {
            method: "eth_signTypedData_v4",
            params: [address, JSON.stringify(typedData)],
          },
        });
      } else {
        return await provider.request({
          method: "eth_signTypedData_v4",
          params: [address, JSON.stringify(typedData)],
          from: address,
        });
      }
    } catch (e: any) {
      throw {
        name: "UnauthorizedError",
        message: "Unauthorized",
        status: 401,
        details: {
          message: e.toString(),
        },
      };
    }
  };

  return <ContractsContext.Provider value={{ contracts, signLoginMessage }}>{children}</ContractsContext.Provider>;
};

export const useContracts = () => {
  const context = useContext(ContractsContext);
  if (!context) {
    throw new Error("useContracts must be used within a <ContractsProvider>");
  }
  return context;
};
