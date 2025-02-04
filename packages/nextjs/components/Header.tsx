"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModalInstructions } from "./sami/ModalInstructions";
import { useAccount } from "wagmi";
import { FaucetButton, RainbowKitCustomConnectButtonOpaque } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  // {
  //   label: "Home",
  //   href: "/",
  // }
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
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { writeContractAsync: MODEwriteContractAsync } = useScaffoldWriteContract("MockMODE");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { address: connectedAddress, isConnected } = useAccount();
  const { data: balance } = useScaffoldReadContract({
    contractName: "MockMODE",
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
        args: [connectedAddress, BigInt(200 * 1e18)],
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
      <div className="navbar-end flex-grow mr-4">
        {isConnected &&
          typeof balance !== "undefined" &&
          (balance < BigInt(100 * 1e18) ? (
            <button
              className="btn btn-primary bg-[#B2CB00] hover:bg-[#A1CA00] mr-2 text-black border-0 shadow-[0_0_10px_#A1CA00] btn-sm text-xl"
              onClick={handleMint}
            >
              <div className="text-sm">Mint 200 $MODE to start betting</div>
              <Image
                src="/mode.png"
                alt="MODE Network Logo"
                width="25"
                height="25"
                className="inline-block align-middle" // Add this to align the image with the text
              />
            </button>
          ) : (
            <button className="btn btn-primary bg-[#B2CB00] hover:bg-[#A1CA00] mr-2 text-black border-0 shadow-[0_0_10px_#A1CA00] btn-sm text-xl">
              <div className="text-sm">{(Number(balance) / 10 ** 18).toFixed(0)} $MODE</div>
              <Image
                src="/mode.png"
                alt="MODE Network Logo"
                width="25"
                height="25"
                className="inline-block align-middle" // Add this to align the image with the text
              />
            </button>
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
