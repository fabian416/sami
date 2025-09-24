"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useContracts } from "~~/providers/ContractsContext";
import { useEmbedded } from "~~/providers/EmbeddedContext";
import { MaxUint256, formatUnits } from "ethers";

// Token decimals (USDC: 6). Change if needed.
const TOKEN_DECIMALS = 6;

type UserOnchainContextType = {
  address: string | null;
  balance: bigint | null;        // raw bigint
  balancePretty: string;         // formatted
  allowance: bigint | null;      // raw bigint
  isBootstrapping: boolean;      // only true on first load
  isRefreshing: boolean;         // background refresh, keep old values
  // Controls
  refreshAll: (withSpinner?: boolean) => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshAllowance: () => Promise<void>;
  approve: (amount?: bigint) => Promise<void>;
  setSpender: (addr: string) => void;
};

const Ctx = createContext<UserOnchainContextType | null>(null);

export const UserOnchainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { contracts } = useContracts();
  const { isEmbedded } = useEmbedded();

  const [address, setAddress] = useState<string | null>(null);
  const [spender, setSpender] = useState<string | null>(null); // default -> sami
  const [balance, setBalance] = useState<bigint | null>(null);
  const [allowance, setAllowance] = useState<bigint | null>(null);

  // Loading states split: bootstrap vs silent refresh
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const lastBalanceRef = useRef<bigint | null>(null);
  const lastAllowanceRef = useRef<bigint | null>(null);

  // Unsub & interval refs
  const unsubRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Avoid overlapping refreshes
  const inflightRef = useRef<number>(0);

  const balancePretty = useMemo(() => {
    if (typeof balance !== "bigint") return "";
    return parseFloat(formatUnits(balance, TOKEN_DECIMALS)).toFixed(2);
  }, [balance]);

  const getCtx = async () => {
    const { usdc, samiAddress, connectedAddress, provider } = await contracts();
    return { usdc, samiAddress, connectedAddress, provider };
  };

  const refreshBalance = async () => {
    try {
      const { usdc, connectedAddress } = await getCtx();
      if (!connectedAddress || !usdc) return;
      const b: bigint = await usdc.balanceOf(connectedAddress);
      if (lastBalanceRef.current !== b) {
        lastBalanceRef.current = b;
        setBalance(b);
      }
    } catch (e) {
      console.warn("refreshBalance error:", e);
    }
  };

  const refreshAllowance = async () => {
    try {
      const { usdc, samiAddress, connectedAddress } = await getCtx();
      if (!connectedAddress || !usdc) return;
      const sp = spender ?? samiAddress;
      const a: bigint = await usdc.allowance(connectedAddress, sp);
      if (lastAllowanceRef.current !== a) {
        lastAllowanceRef.current = a;
        setAllowance(a);
      }
    } catch (e) {
      console.warn("refreshAllowance error:", e);
    }
  };

  // Main refresh entry. withSpinner=true only for first/explicit loads.
  const refreshAll = async (withSpinner: boolean = false) => {
    // Do not start a second refresh if one is in-flight
    if (inflightRef.current > 0) return;
    inflightRef.current++;

    try {
      if (withSpinner) {
        setIsBootstrapping(false); // ensure only first paint uses bootstrapping
        setIsRefreshing(false);
      } else {
        setIsRefreshing(true);
      }

      const { connectedAddress, samiAddress } = await getCtx();
      setAddress(connectedAddress ?? null);
      if (!spender && samiAddress) setSpender(samiAddress);

      await Promise.all([refreshBalance(), refreshAllowance()]);
    } finally {
      inflightRef.current--;
      if (withSpinner) {
        // End of an explicit/first load
        setIsBootstrapping(false);
        setIsRefreshing(false);
      } else {
        // End of silent background refresh
        setIsRefreshing(false);
      }
    }
  };

  const approve = async (amount?: bigint) => {
    const { usdc } = await getCtx();
    if (!usdc) throw new Error("USDC not ready");
    const sp = spender;
    if (!sp) throw new Error("Spender not set");
    const tx = await usdc.approve(sp, amount ?? MaxUint256);
    await tx.wait();
    await refreshAllowance();
  };

  // Init + subscriptions
  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      // Cleanup previous
      if (unsubRef.current) { try { unsubRef.current(); } catch {} unsubRef.current = null; }
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }

      // First load with spinner
      await refreshAll(true);

      // Subscribe to events
      try {
        const { usdc, samiAddress, connectedAddress } = await getCtx();
        if (!usdc || !connectedAddress) return;

        if (!spender && samiAddress) setSpender(samiAddress);

        const inFilter = usdc.filters.Transfer(null, connectedAddress);
        const outFilter = usdc.filters.Transfer(connectedAddress, null);
        const approvalFilter = usdc.filters.Approval(connectedAddress, null);

        const onTransfer = () => refreshBalance(); // silent (doesn't toggle spinner)
        const onApproval = async (_owner: string, toSpender: string) => {
          const current = spender ?? samiAddress;
          if (current && toSpender.toLowerCase() === current.toLowerCase()) {
            await refreshAllowance(); // silent
          }
        };

        usdc.on(inFilter, onTransfer);
        usdc.on(outFilter, onTransfer);
        usdc.on(approvalFilter, onApproval);

        unsubRef.current = () => {
          try {
            usdc.off(inFilter, onTransfer);
            usdc.off(outFilter, onTransfer);
            usdc.off(approvalFilter, onApproval);
          } catch {}
        };
      } catch (e) {
        console.warn("UserOnchainProvider: event subscription failed:", e);
      }

      // Silent polling fallback every 5s
      intervalRef.current = setInterval(() => {
        refreshAll(false);
      }, 4000);

      // Revalidate when tab becomes visible (silent)
      const onVisibility = () => {
        if (document.visibilityState === "visible") refreshAll(false);
      };
      document.addEventListener("visibilitychange", onVisibility);

      return () => {
        if (!mounted) return;
        document.removeEventListener("visibilitychange", onVisibility);
      };
    };

    setup();

    return () => {
      mounted = false;
      if (unsubRef.current) { try { unsubRef.current(); } catch {} unsubRef.current = null; }
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [contracts, isEmbedded, spender]);

  const value = useMemo<UserOnchainContextType>(() => ({
    address,
    balance,
    balancePretty,
    allowance,
    isBootstrapping,
    isRefreshing,
    refreshAll,
    refreshBalance,
    refreshAllowance,
    approve,
    setSpender: (addr: string) => setSpender(addr),
  }), [address, balance, balancePretty, allowance, isBootstrapping, isRefreshing]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useUserOnchain = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUserOnchain must be used within <UserOnchainProvider>");
  return ctx;
};
