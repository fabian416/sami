import Image from "next/image";

export const ModalFinished = ({ winner, isBetGame }: any) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#2c2171] glow-purple rounded-2xl items-center justify-center pb-8 px-12">
        <div className="flex items-center justify-center text-center text-4xl pt-8 pb-2">
          {winner === "You win" ? <strong>You won</strong> : <strong>SAMI won</strong>}
        </div>
        <div className="flex items-center justify-center text-center flex-col gap-2">
          {winner === "You win" ? (
            <div className="flex justify-center items-center flex-col py-2">
              {isBetGame && (
                <div className="flex flex-row py-2">
                  <div>Your 500</div>&nbsp;
                  <Image
                    src="/mode.png"
                    alt="MODE Network Logo"
                    width="25"
                    height="25"
                    className="inline-block align-middle" // Add this to align the image with the text
                  />
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
                  <div>Sami just claimed your 100</div>&nbsp;
                  <Image
                    src="/mode.png"
                    alt="MODE Network Logo"
                    width="25"
                    height="25"
                    className="inline-block align-middle" // Add this to align the image with the text
                  />
                  &nbsp;
                  <div>tokens.</div>
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
