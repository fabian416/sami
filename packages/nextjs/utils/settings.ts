const staging = {
  apiDomain: "https://staging.playsami.fun",
  environment: "staging",
  base: {
    chainId: 84532,
    rpcUrls: {
      84532: "https://sepolia.base.org",
    },
    supportedChains: [
      {
        chainId: "0x14a74",
        chainName: "Base Sepolia",
        nativeCurrency: {
          name: "Sepolia ETH",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: ["https://sepolia.base.org"],
        blockExplorerUrls: ["https://sepolia.basescan.org"],
        iconUrls: ["https://cryptologos.cc/logos/ethereum-eth-logo.png?v=032"],
      },
    ],
  },
} as const;

const production = {
  apiDomain: "https://playsami.fun",
  environment: "production",
  base: {
    chainId: 8453,
    rpcUrls: {
      8453: "https://mainnet.base.org",
    },
    supportedChains: [
      {
        chainId: "0x2105",
        chainName: "Base",
        nativeCurrency: {
          name: "Ether",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: ["https://mainnet.base.org"],
        blockExplorerUrls: ["https://basescan.org"],
        iconUrls: ["https://cryptologos.cc/logos/ethereum-eth-logo.png?v=032"],
      },
    ],
  },
} as const;

const development = {
  apiDomain: "http://localhost:5001",
  environment: "development",
  base: {
    chainId: 8453,
    rpcUrls: {
      8453: "https://mainnet.base.org",
    },
    supportedChains: [
      {
        chainId: "0x2105",
        chainName: "Base",
        nativeCurrency: {
          name: "Ether",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: ["https://mainnet.base.org"],
        blockExplorerUrls: ["https://basescan.org"],
        iconUrls: ["https://cryptologos.cc/logos/ethereum-eth-logo.png?v=032"],
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
  base: ChainConfig;
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
