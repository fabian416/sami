import { BugAntIcon, ClockIcon, CurrencyDollarIcon, XCircleIcon } from "@heroicons/react/24/outline";

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
      <div className="bg-base-300 rounded-2xl items-center justify-center mx-4 md:mx-16 max-h-[85vh] overflow-auto">
        <CloseButton closeModal={closeModal} />
        <div className="flex justify-between items-center md:mb-8 mb-6">
          <div className="flex-grow text-center">
            <span className="block text-2xl font-bold">About the game</span>
          </div>
        </div>
        <div className="flex justify-between items-between md:gap-12 gap-4 flex-col sm:flex-row md:pb-16 pb-4 mx-4 overflow-scroll">
          <div className="flex flex-col bg-base-100 px-4 py-4 lg:px-10 lg:py-10 text-center items-center max-w-xs rounded-3xl md:ml-4">
            <BugAntIcon className="h-8 w-8 fill-secondary" />
            <p>
              Engage in a quick chat with strangers and try to figure out who our AI agent, SAMI, is. <br /> It&apos;s
              harder than you think!
            </p>
          </div>
          <div className="flex flex-col bg-base-100 px-4 py-4 lg:px-10 lg:py-10 text-center items-center max-w-xs rounded-3xl">
            <CurrencyDollarIcon className="h-8 w-8 fill-secondary" />
            <p>
              You pay a fee for each game, and it adds up to a prize that gets distributed among winners. <br />
              Alternatively, you can play for free, but you won&apos;t earn any prize.
            </p>
          </div>
          <div className="flex flex-col bg-base-100 px-4 py-4 lg:px-10 lg:py-10 text-center items-center max-w-xs rounded-3xl">
            <ClockIcon className="h-8 w-8 fill-secondary" />
            <p>
              Each game consists of two rounds. Each round lasts 120 seconds, after which everyone votes on who they
              think SAMI is.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CloseButton = ({ closeModal }: any) => {
  return (
    <div className="flex justify-end md:pb-4">
      <button className="btn btn-ghost" onClick={closeModal}>
        <XCircleIcon className="h-1/2" />
      </button>
    </div>
  );
};

export { CloseButton };
