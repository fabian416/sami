"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePathname } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/20/solid";
import RainbowKitCustomConnectButtonOpaque from "./ConnectButtonOpaque";
import { useOutsideClick } from "~~/hooks/useOutsideClick";
import { useContracts } from "~~/providers/ContractsContext";
import { useEmbedded } from "~~/providers/EmbeddedContext";
import { BET_AMOUNT, MINT_AMOUNT } from "~~/utils/constants";
import { notification } from "~~/utils/scaffold-eth";
import { useUserOnchain } from "~~/providers/UserOnChainContext";

const ENVIRONMENT =
  (typeof import.meta !== "undefined"
    ? import.meta.env.VITE_PUBLIC_ENVIRONMENT
    : process.env.VITE_PUBLIC_ENVIRONMENT) as "production" | "staging" | "development" | undefined;

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [{ label: "Home", href: "/" }];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();
  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              to={href}
              className={`${
                isActive ? "bg-secondary shadow-md" : ""
              } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
      <li>
        <Link
          to="https://forms.gle/F9daougSAVgFrzWG8"
          className="bg-pink-600 hover:bg-pink-700 !text-white focus:bg-success py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col"
          target="_blank"
        >
          <span>Share your feedback!</span>
        </Link>
      </li>
    </>
  );
};

/**
 * Header with live-updating USDC balance.
 * - Always renders the balance chip.
 * - Shows "…" ONLY on the very first fetch (bootstrapping).
 * - During background refreshes, keeps showing the last known good value (no extra dot).
 * - In non-production: shows Mint button in addition to the chip if balance < BET_AMOUNT.
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);

  const { isEmbedded } = useEmbedded();
  const { contracts } = useContracts();
  const { address, balance, balancePretty, isBootstrapping, refreshBalance } = useUserOnchain();

  useOutsideClick(burgerMenuRef, useCallback(() => setIsDrawerOpen(false), []));

  const isProd = ENVIRONMENT === "production";
  const canShowWalletUI = Boolean(address || isEmbedded);
  const isLoaded = typeof balance === "bigint";
  const showDots = !isLoaded && isBootstrapping;

  // Cache last non-empty pretty balance to avoid flicker/dot during background refreshes
  const lastPrettyRef = useRef<string | null>(null);
  useEffect(() => {
    if (isLoaded) {
      // Ensure "0" is shown if balancePretty is falsy for zero
      lastPrettyRef.current = balancePretty ?? "0";
    }
  }, [isLoaded, balancePretty]);

  // Decide what to display inside the chip
  const displayPretty = showDots
    ? "…"
    : isLoaded
    ? balancePretty ?? "0"
    : lastPrettyRef.current ?? "…";

  const handleMint = async () => {
    try {
      const { usdc, connectedAddress } = await contracts();
      if (!connectedAddress) {
        notification.error("Please connect your wallet");
        return;
      }
      const tx = await usdc.mint(connectedAddress, MINT_AMOUNT);
      await tx.wait();
      notification.success("Tokens minted successfully!");
      await refreshBalance();
    } catch (error) {
      console.error("Error minting tokens:", error);
      notification.error("Minting tokens failed, please try again.");
    }
  };

  // Balance chip (always visible when wallet UI is allowed)
  const BalanceChip = () => (
    <span className="flex flex-row bg-[#2672BE] text-white glow-blue px-3 py-1 rounded-lg items-center justify-center gap-1 ml-4 mr-2 text-lg font-bold">
      <TokenLogo />
      <span className="ml-1">{displayPretty}</span>
    </span>
  );

  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <div className="lg:hidden dropdown" ref={burgerMenuRef}>
          <label
            tabIndex={0}
            className={`ml-1 btn btn-ghost ${isDrawerOpen ? "hover:bg-secondary" : "hover:bg-transparent"}`}
            onClick={() => setIsDrawerOpen(prev => !prev)}
          >
            <Bars3Icon className="h-1/2" />
          </label>
          {isDrawerOpen && (
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
              onClick={() => setIsDrawerOpen(false)}
            >
              <HeaderMenuLinks />
            </ul>
          )}
        </div>

        <Link to="/" className="hidden lg:flex items-center gap-2 ml-2 mr-6 shrink-0">
          <div className="flex relative w-8 h-8">
            <img alt="SE2 logo" className="w-auto h-auto cursor-pointer" src="/logo.png" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold leading-tight">SAMI</span>
          </div>
        </Link>

        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks />
        </ul>
      </div>

      <div className="navbar-center hidden lg:flex flex-grow justify-center" />

      <div className="navbar-end flex-grow mr-4">
        {/* Wallet / balance area */}
        {canShowWalletUI && (
          <>
            {/* Always show the chip */}
            <BalanceChip />

            {/* In non-production, if loaded AND balance < BET_AMOUNT, show Mint button alongside the chip */}
            {!isProd && isLoaded && balance! < BET_AMOUNT && (
              <button
                className="flex flex-row btn btn-primary bg-[#2672BE] hover:bg-[#2672BE] glow-blue mr-2 text-white border-0 shadow-[0_0_10px_#A1CA00] btn-sm text-xl"
                onClick={handleMint}
                disabled={showDots}
              >
                <div className="text-sm">Get $USDC</div>
                <TokenLogo />
              </button>
            )}
          </>
        )}

        {/* Connect button (hidden in embedded mode) */}
        {!isEmbedded && <RainbowKitCustomConnectButtonOpaque />}
      </div>
    </div>
  );
};

export const TokenLogo = ({
  width = 25,
  height = 25,
  className = "inline-block align-bottom",
}: {
  width?: number;
  height?: number;
  className?: string;
}) => {
  return <img src="/usdc-logo.png" alt="USDC Logo" width={width} height={height} className={className} />;
};
