"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePathname } from "next/navigation";
import RainbowKitCustomConnectButtonOpaque from "./ConnectButtonOpaque";
import { Bars3Icon } from "@heroicons/react/20/solid";
import { useOutsideClick } from "~~/hooks/useOutsideClick";
import { useContracts } from "~~/providers/ContractsContext";
import { useEmbedded } from "~~/providers/EmbeddedContext";
import { DECIMALS } from "~~/utils/constants";
import { notification } from "~~/utils/scaffold-eth";

const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT;

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  }
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks?.map(({ label, href, icon }) => {
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
 * Site header
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [balance, setBalance] = useState<bigint | undefined | null>(undefined);
  const [connectedAddress, setConnectedAddress] = useState(null);

  const { isEmbedded } = useEmbedded();
  const { contracts } = useContracts();

  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const { usdc, connectedAddress: address } = await contracts();
        if (!address) return;
        setConnectedAddress(address);
        const result = await usdc.balanceOf(address);
        setBalance(result);
      } catch (err) {
        console.error("Error fetching USDC balance:", err);
        setBalance(BigInt(0));
      }
    };

    fetchBalance();
  }, [contracts, isEmbedded]);

  const handleMint = async () => {
    try {
      const { usdc, connectedAddress: address } = await contracts();
      if (!address) {
        notification.error("Please connect your wallet");
        return;
      }

      const tx = await usdc.mint(address, BigInt(3 * DECIMALS));
      await tx.wait();
      notification.success("Tokens minted successfully!");
    } catch (error) {
      console.error("Error minting tokens:", error);
      notification.error("Minting tokens failed, please try again.");
    }
  };

  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <div
          className="lg:hidden dropdown"
          //ref={"burgerMenuRef"}
        >
          <label
            tabIndex={0}
            className={`ml-1 btn btn-ghost ${isDrawerOpen ? "hover:bg-secondary" : "hover:bg-transparent"}`}
            onClick={() => {
              setIsDrawerOpen(prevIsOpenState => !prevIsOpenState);
            }}
          >
            <Bars3Icon className="h-1/2" />
          </label>
          {isDrawerOpen && (
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
              onClick={() => {
                setIsDrawerOpen(false);
              }}
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
      <div className="navbar-center hidden lg:flex flex-grow justify-center"></div>
      <div className="navbar-end flex-grow mr-4">

        {(!!connectedAddress || isEmbedded) &&
          typeof balance !== "undefined" &&
          typeof balance === "bigint" &&
          (ENVIRONMENT === "production" ? (
            <span className="flex flex-row bg-[#2672BE] text-white glow-blue px-3 py-1 rounded-lg items-center justify-center gap-1 ml-4 mr-2 text-lg font-bold">
              <TokenLogo className="" />
              <span className="ml-1">{(Number(balance) / DECIMALS).toFixed(2)}</span>
            </span>
          ) : balance < BigInt(1 * DECIMALS) ? (
            <button
              className="flex flex-row btn btn-primary bg-[#2672BE] hover:bg-[#2672BE] glow-blue mr-2 text-white border-0 shadow-[0_0_10px_#A1CA00] btn-sm text-xl"
              onClick={handleMint}
            >
              <div className="text-sm">Get $USDC</div>
              <TokenLogo className="" />
            </button>
          ) : (
            <span className="flex flex-row bg-[#2672BE] text-white glow-blue px-3 py-1 rounded-lg items-center justify-center gap-1 ml-4 mr-2 text-lg font-bold">
              <TokenLogo className="" />
              <span className="ml-1">{(Number(balance) / DECIMALS).toFixed(2)}</span>
            </span>
          ))}

        {!isEmbedded && <RainbowKitCustomConnectButtonOpaque />}
      </div>
    </div>
  );
};

export const TokenLogo = ({
  width = 25,
  height = 25,
  className = "inline-block align-bottom",
}:
{
  width?: number;
  height?: number;
  className?: string;
}) => {
  return <img src="/usdc-logo.png" alt="USDC Logo" width={width} height={height} className={className} />;
};
