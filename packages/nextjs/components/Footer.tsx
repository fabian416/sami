import React from "react";
import Image from "next/image";
import Link from "next/link";
import { hardhat } from "viem/chains";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

/**
 * Site footer
 */
export const Footer = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <div className="min-h-0 py-2 px-1 mb-11 lg:mb-0">
      <div>
        <div className="fixed flex justify-between items-center w-full z-10 p-4 bottom-0 left-0 pointer-events-none">
          <div className="flex flex-col md:flex-row gap-2 pointer-events-auto"></div>
          <SwitchTheme className={`pointer-events-auto ${isLocalNetwork ? "self-end md:self-auto" : ""}`} />
        </div>
      </div>
      <div className="w-full">
        <ul className="menu menu-horizontal w-full">
          <div className="flex justify-center items-center gap-2 text-sm w-full">
            <div className="flex justify-center items-center gap-1">
              {/* <p className="m-0 text-center">
                Built with <HeartIcon className="inline-block h-4 w-4" /> by
              </p>
              <span>Los pibes</span>
              <span>·</span> */}
              <div className="flex flex-row gap-3 text-center">
                <div className="text-center">
                  <Link href="/SAMIpaper.pdf" className="text-white" passHref target="_blank">
                    <div className="p-2 bg-[#DAFB08] glow-yellow rounded-lg text-black">
                      <h2 className="sami-title text-sm mt-8 text-center">Whitepaper</h2>
                    </div>
                  </Link>{" "}
                </div>
              </div>
            </div>
          </div>
        </ul>
      </div>
    </div>
  );
};
