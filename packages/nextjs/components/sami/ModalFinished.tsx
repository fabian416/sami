import Image from "next/image";

export const ModalFinished = ({ winner }: any) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#2c2171] rounded-2xl items-center justify-center opacity-80">
        <div className="flex items-center justify-center text-center text-4xl flex-col gap-2 p-10">
          {winner === "humans" ? (
            <strong className="mb-2">Humans won</strong>
          ) : (
            <strong className="mb-2">SAMI won</strong>
          )}
          <div className="w-48 h-48">
            {winner === "humans" ? (
              <div className="flex relative w-48 h-48">
                <Image alt="SE2 logo" className="cursor-pointer" fill src="/humans-won.webp" />
              </div>
            ) : (
              <div className="flex relative w-48 h-48">
                <Image alt="SE2 logo" className="cursor-pointer" fill src="/sami-won.webp" />
              </div>
            )}
          </div>
          <button
            className="btn btn-primary text-2xl px-10 glow-cyan bg-[#1CA297] hover:bg-[#33B3A8] border-0 mt-4"
            onClick={() => window.location.reload()}
          >
            Play again!
          </button>
        </div>
      </div>
    </div>
  );
};
