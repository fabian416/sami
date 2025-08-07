"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const RainbowKitCustomConnectButtonOpaque = () => (
  <ConnectButton.Custom>
    {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted, authenticationStatus }) => {
      const ready = mounted && authenticationStatus !== "loading";
      const connected = ready && account && chain;

      return (
        <div
          className="dropdown dropdown-end leading-3"
          {...(!ready && {
            "aria-hidden": true,
            style: { opacity: 0, pointerEvents: "none" },
          })}
        >
          {!connected ? (
            <button className="btn btn-primary btn-sm" onClick={openConnectModal} type="button">
              Connect Wallet
            </button>
          ) : chain.unsupported ? (
            <button className="btn btn-error btn-sm" onClick={openChainModal} type="button">
              Wrong network
              <ChevronDownIcon className="h-6 w-4 ml-2 sm:ml-0" />
            </button>
          ) : (
            <details className="dropdown dropdown-end leading-3">
              <summary
                tabIndex={0}
                className="btn btn-secondary btn-sm pl-0 pr-2 shadow-md dropdown-toggle gap-0 !h-auto"
              >
                <span className="ml-2 mr-1">
                  {account.displayName.length > 12
                    ? `${account.displayName.slice(0, 6)}...${account.displayName.slice(-4)}`
                    : account.displayName}
                </span>
                <ChevronDownIcon className="h-6 w-4 ml-2 sm:ml-0" />
              </summary>
              <ul
                tabIndex={0}
                className="dropdown-content menu z-[2] p-2 mt-2 shadow-center shadow-accent bg-base-200 rounded-box gap-1"
              >
                <li>
                  <button
                    className="menu-item btn-sm !rounded-xl flex gap-3 py-3"
                    onClick={openChainModal}
                    type="button"
                  >
                    Cambiar red
                  </button>
                </li>
                <li>
                  <button
                    className="menu-item text-error btn-sm !rounded-xl flex gap-3 py-3"
                    onClick={openAccountModal}
                    type="button"
                  >
                    Desconectar
                  </button>
                </li>
              </ul>
            </details>
          )}
        </div>
      );
    }}
  </ConnectButton.Custom>
);

export default RainbowKitCustomConnectButtonOpaque;
