import Image from "next/image";
import { TokenLogo } from "../common/Header";

export const ModalFinished = ({ winner, isBetGame, amountOfWinners }: any) => {
  const finalAmountOfTokens = (3 / amountOfWinners).toFixed(2);
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#2c2171] glow-purple text-white rounded-2xl items-center justify-center pb-8 px-12">
        <div className="flex items-center justify-center text-center text-4xl pt-8 pb-2">
          {winner === "You win" ? <strong>You won</strong> : <strong>You lost</strong>}
        </div>
        <div className="flex items-center justify-center text-center flex-col gap-2">
          {winner === "You win" ? (
            <div className="flex justify-center items-center flex-col py-2">
              {isBetGame && (
                <div className="flex flex-row py-2">
                  <div>Your {finalAmountOfTokens}</div>&nbsp;
                  <TokenLogo />
                  &nbsp;
                  <div>are on the way!</div>
                </div>
              )}
              <div className="flex relative w-48 h-48">
                <Image alt="You Win Image" className="cursor-pointer" fill src="/humans-won.webp" />
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center flex-col py-2">
              {isBetGame && (
                <div className="flex flex-row py-2">
                  <div>Say goodbye to your {(1).toFixed(2)} </div>&nbsp;
                  <TokenLogo />
                  &nbsp;
                  <div></div>
                </div>
              )}
              <div className="flex relative w-48 h-48">
                <Image alt="SAMI Wins Image" className="cursor-pointer" fill src="/sami-won.webp" />
              </div>
            </div>
          )}
          <button className="cool-button pb-4" onClick={() => window.location.reload()}>
            Play again
          </button>
        </div>
      </div>
    </div>
  );
};
