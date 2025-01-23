import { CloseButton } from "./ModalInstructions";
import { CakeIcon, NoSymbolIcon } from "@heroicons/react/24/outline";

export const ModalFinished = ({ winner }: any) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-base-300 rounded-2xl items-center justify-center">
        <div className="flex items-center justify-center text-center flex-col gap-4 p-8">
          {winner === "humans" ? <span>Humans won</span> : <span>The IA won</span>}
          <div className="w-16 h-16">{winner === "humans" ? <CakeIcon /> : <NoSymbolIcon />}</div>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Play again
          </button>
        </div>
      </div>
    </div>
  );
};
