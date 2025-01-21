import { BugAntIcon, ClockIcon, CurrencyDollarIcon, XCircleIcon } from "@heroicons/react/24/outline";

export const ModalInstructions = ({ closeModal }: any) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="flex-grow bg-base-300 rounded-2xl items-center justify-center mx-16">
        <div className="flex justify-end pb-4">
          <button className="btn btn-ghost" onClick={closeModal}>
            <XCircleIcon className="h-1/2" />
          </button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex-grow text-center">
            <span className="block text-2xl font-bold">About the game</span>
          </div>
        </div>
        <div className="flex justify-center items-center gap-12 flex-col sm:flex-row pb-16">
          <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
            <BugAntIcon className="h-8 w-8 fill-secondary" />
            <p>Have a quick chat with strangers and try to discover who&apos;s an AI agent. Harder than you think!</p>
          </div>
          <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
            <CurrencyDollarIcon className="h-8 w-8 fill-secondary" />
            <p>You pay a fee for each game, and it adds up to a prize that gets distributed among winners.</p>
          </div>
          <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
            <ClockIcon className="h-8 w-8 fill-secondary" />
            <p>Each round lasts 90 seconds. Then, everyone votes who they think the AI is.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
