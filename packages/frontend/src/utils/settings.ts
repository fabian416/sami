const development = {
  apiDomain: "http://localhost:5001",
  environment: "development",
  polygon: {
    chainId: 80002,
    rpcUrls: {
      80002: "https://rpc-amoy.polygon.technology",
    },
    supportedChains: [
      {
        chainId: "0x13882",
        chainName: "Polygon Amoy",
        nativeCurrency: {
          name: "MATIC",
          symbol: "MATIC",
          decimals: 18,
        },
        rpcUrls: ["https://rpc-amoy.polygon.technology"],
        blockExplorerUrls: ["https://amoy.polygonscan.com"],
        iconUrls: ["https://cryptologos.cc/logos/polygon-matic-logo.png?v=032"],
      },
    ],
  },
} as const;

const staging = {
  apiDomain: "https://staging-api.playsami.fun",
  environment: "staging",
  polygon: {
    chainId: 80002,
    rpcUrls: {
      80002: "https://rpc-amoy.polygon.technology",
    },
    supportedChains: [
      {
        chainId: "0x13882",
        chainName: "Polygon Amoy",
        nativeCurrency: {
          name: "MATIC",
          symbol: "MATIC",
          decimals: 18,
        },
        rpcUrls: ["https://rpc-amoy.polygon.technology"],
        blockExplorerUrls: ["https://amoy.polygonscan.com"],
        iconUrls: ["https://cryptologos.cc/logos/polygon-matic-logo.png?v=032"],
      },
    ],
  },
} as const;

const production = {
  apiDomain: "https://api.playsami.fun",
  environment: "production",
  polygon: {
    chainId: 137,
    rpcUrls: {
      137: "https://polygon-rpc.com",
    },
    supportedChains: [
      {
        chainId: "0x89",
        chainName: "Polygon",
        nativeCurrency: {
          name: "MATIC",
          symbol: "MATIC",
          decimals: 18,
        },
        rpcUrls: ["https://polygon-rpc.com"],
        blockExplorerUrls: ["https://polygonscan.com"],
        iconUrls: ["https://cryptologos.cc/logos/polygon-matic-logo.png?v=032"],
      },
    ],
  },
} as const;

type ChainConfig = {
  chainId: number;
  rpcUrls: { [key: number]: string };
  supportedChains: ReadonlyArray<{
    chainId: string;
    chainName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: readonly string[];
    blockExplorerUrls: readonly string[];
    iconUrls: readonly string[];
  }>;
};

export type SettingsType = {
  apiDomain: string;
  environment: "development" | "staging" | "production";
  polygon: ChainConfig;
};

export const allSettings: Record<string, SettingsType> = {
  "http://localhost:3000": development,
  "http://localhost:3001": development,
  "http://127.0.0.1:3000": development,
  "http://127.0.0.1:3001": development,
  "https://staging.playsami.fun": staging,
  "https://playsami.fun": production,
  default: development,
};

export const getSettings = () => {
  const origin = typeof window !== "undefined" ? window.origin : "default";
  return allSettings[origin] || allSettings.default;
};
