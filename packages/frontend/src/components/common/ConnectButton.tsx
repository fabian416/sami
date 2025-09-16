"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export const RainbowKitCustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <>
            {!connected ? (
              <button className="cool-button" onClick={openConnectModal} type="button">
                Connect Wallet
              </button>
            ) : null}
          </>
        );
      }}
    </ConnectButton.Custom>
  );
};
