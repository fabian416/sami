"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModalInstructions } from "./sami/ModalInstructions";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className="navbar-start w-auto lg:w-1/2 mx-1">
        <button className="btn btn-primary btn-sm text-xl" onClick={openModal}>
          {/* <AcademicCapIcon className="h-1/2" /> */}?
        </button>

        <Link href="/" passHref className="hidden lg:flex items-center gap-2 ml-4 mr-6 shrink-0">
          <div className="flex relative w-8 h-8">
            <Image alt="SE2 logo" className="cursor-pointer" fill src="/sami.png" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-tight">SAMI</span>
            <span className="text-xs">Who&apos;s human here!?</span>
          </div>
        </Link>
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end flex-grow mr-4">
        <RainbowKitCustomConnectButton />
        <FaucetButton />
      </div>

      {isModalOpen && <ModalInstructions closeModal={closeModal} />}
    </div>
  );
};
