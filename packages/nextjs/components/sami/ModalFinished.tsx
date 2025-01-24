import Image from "next/image";

export const ModalFinished = ({ winner }: any) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-base-100 rounded-2xl items-center justify-center">
        <div className="flex items-center justify-center text-center flex-col gap-2 py-8 px-16">
          {winner === "humans" ? <strong>Humans won</strong> : <strong>SAMI won</strong>}
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
          <button className="btn btn-primary mt-4" onClick={() => window.location.reload()}>
            Play again
          </button>
        </div>
      </div>
    </div>
  );
};
