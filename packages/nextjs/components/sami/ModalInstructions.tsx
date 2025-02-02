import { XMarkIcon } from "@heroicons/react/20/solid";
import { BugAntIcon, ClockIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";

export const ModalInstructions = ({ closeModal }: any) => {
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // Verifica si el clic fue fuera del contenido del modal
    if (event.target === event.currentTarget) {
      closeModal();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-100"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-[#1CA297] opacity-80 glow-cyan rounded-2xl items-center justify-center mx-4 md:mx-16  overflow-auto">
        <div className="absolute top-4 right-4">
          <CloseButton closeModal={closeModal} />
        </div>
        <div className="flex justify-between items-center md:mb-8 mb-6 mt-6">
          <div className="flex-grow text-center">
            <span className="block text-5xl font-bold">Instructions</span>
          </div>
        </div>
        <div className="flex justify-between items-between md:gap-12 gap-4 flex-col sm:flex-row pb-2 mx-4 overflow-scroll">
          <div className="flex flex-col bg-[#2c2171]  p-4 text-center items-center max-w-xs rounded-3xl md:ml-4">
            <BugAntIcon className="h-20 w-20 fill-secondary" />
            <p className="text-2xl">Chat with strangers and try to figure out who is SAMI, the AI agent.</p>
          </div>
          <div className="flex flex-col bg-[#2c2171] p-4 text-center items-center max-w-xs rounded-3xl">
            <ClockIcon className="h-20 w-20 fill-secondary" />
            <p className="text-2xl">After 2 minutes, vote on who you think SAMI was in the chat.</p>
          </div>
          <div className="flex flex-col bg-[#2c2171] p-4 text-center items-center max-w-xs rounded-3xl">
            <CurrencyDollarIcon className="h-20 w-20 fill-secondary" />
            <p className="text-2xl">Play for free, or bet 100 $MODE, and if you guess, you get the double.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CloseButton = ({ closeModal }: any) => {
  return (
    <div className="flex justify-end md:m-4 ">
      <button className="btn btn-ghost bg-red-600 hover:bg-red-500" onClick={closeModal}>
        <XMarkIcon className="h-2/3" />
      </button>
    </div>
  );
};

export { CloseButton };
