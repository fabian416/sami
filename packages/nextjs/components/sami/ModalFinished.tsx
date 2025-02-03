import Image from "next/image";

export const ModalFinished = ({ winner }: any) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#2c2171] glow-purple rounded-2xl items-center justify-center">
        <div className="flex items-center justify-center text-center text-4xl flex-col gap-2 py-8 px-16">
          {winner === "You win" ? <strong>You won</strong> : <strong>SAMI won</strong>}
          <div className="w-48 h-48 m-2">
            {winner === "You win" ? (
              <div className="flex relative w-48 h-48">
                <Image alt="You Win Image" className="cursor-pointer" fill src="/humans-won.webp" />
              </div>
            ) : (
              <div className="flex relative w-48 h-48">
                <Image alt="SAMI Wins Image" className="cursor-pointer" fill src="/sami-won.webp" />
              </div>
            )}
          </div>
          <button className="cool-button " onClick={() => window.location.reload()}>
            Play again
          </button>
        </div>
      </div>
    </div>
  );
};
