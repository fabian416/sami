"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DECIMALS } from "./sami/ChooseGame";
import { ModalInstructions } from "./sami/ModalInstructions";
import { useAccount } from "wagmi";
import { Bars3Icon } from "@heroicons/react/20/solid";
import { FaucetButton, RainbowKitCustomConnectButtonOpaque } from "~~/components/scaffold-eth";
import { useOutsideClick, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
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
  },
  {
    label: "Leaderboard",
    href: "/leaderboard",
  },
  {
    label: "About",
    href: "/about",
  },
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
              href={href}
              passHref
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
          href="https://docs.google.com/forms/d/e/1FAIpQLSf1mWUBPNvDFOpUZj3tweC_3hNZr9ju0-yA3x6lw0VIeXZdAA/viewform"
          passHref
          className="bg-success hover:bg-success !text-black focus:bg-success py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col"
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  const { address: connectedAddress, isConnected } = useAccount();

  const { writeContractAsync: MODEwriteContractAsync } = useScaffoldWriteContract({ contractName: "USDC" });

  const { data: balance } = useScaffoldReadContract({
    contractName: "USDC",
    functionName: "balanceOf",
    args: [connectedAddress],
    watch: true,
  });

  const handleMint = async () => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      const contractResponse = await MODEwriteContractAsync({
        functionName: "mint",
        args: [connectedAddress, BigInt(3 * DECIMALS)],
      });

      if (contractResponse) {
        notification.success("Tokens minted successfully!");
      }
    } catch (error) {
      console.error("Error minting tokens:", error);
      notification.error("Minting tokens failed, please try again.");
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const firstTime = localStorage.getItem("firstTime");
    if (!firstTime) {
      openModal();
      localStorage.setItem("firstTime", "true");
    }
  }, []);

  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <div className="lg:hidden dropdown" ref={burgerMenuRef}>
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
        <Link href="/" passHref className="hidden lg:flex items-center gap-2 ml-2 mr-6 shrink-0">
          <div className="flex relative w-8 h-8">
            <Image alt="SE2 logo" className="w-auto h-auto cursor-pointer" fill src="/logo.png" />
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
        {isConnected &&
          typeof balance !== "undefined" &&
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
        <RainbowKitCustomConnectButtonOpaque />
        <FaucetButton />
      </div>
      <button
        className="btn btn-primary bg-[#1CA297] hover:bg-[#33B3A8] mr-2 text-white border-0 glow-cyan btn-sm text-xl"
        onClick={openModal}
      >
        ?
      </button>

      {isModalOpen && <ModalInstructions closeModal={closeModal} />}
    </div>
  );
};

export const TokenLogo = ({
  width = 25,
  height = 25,
  className = "inline-block align-bottom",
}: // Add this to align the image with the text
{
  width?: number;
  height?: number;
  className?: string;
}) => {
  return <Image src="/usdc-logo.png" alt="USDC Logo" width={width} height={height} className={className} />;
};
