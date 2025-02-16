import Image from "next/image";
import { TokenLogo } from "../Header";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { ClockIcon } from "@heroicons/react/24/outline";

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
      <div className="relative bg-[#1CA297] glow-cyan rounded-2xl items-center justify-center mx-4 md:mx-16 overflow-auto">
        <div className="absolute top-4 right-2 md:right-4">
          <CloseButton closeModal={closeModal} />
        </div>
        <div className="flex justify-between items-center md:mb-8 mb-6 mt-6">
          <div className="flex-grow text-center">
            <span className="block text-3xl md:text-7xl sami-title text-white">SAMI rules!</span>
          </div>
        </div>
        <div className="flex justify-between items-between md:gap-12 gap-4 flex-col sm:flex-row pb-2 mx-4 overflow-scroll md:px-8 md:pb-8 md:pt-4">
          <div className="flex flex-col bg-[#2c2171]  p-4 text-center items-center max-w-xs rounded-3xl md:ml-4">
            {/* <BugAntIcon className="h-20 w-20 fill-secondary" /> */}
            <Image src="/logo.png" alt="SAMI Logo" width="100" height="100" />
            <p className="text-md md:text-xl">
              <span className="text-white">Chat with strangers and figure out </span>
              <span className="text-[#3DCCE1]">who is SAMI, the AI agent.</span>
            </p>
          </div>
          <div className="flex flex-col bg-[#2c2171] p-4 text-center items-center max-w-xs rounded-3xl">
            <ClockIcon className="h-24 w-24 fill-secondary" />
            <p className="text-md md:text-xl mt-5">
              <span className="text-white"> After 2 minutes, </span>
              <span className="text-[#3DCCE1]">vote on who you think SAMI was</span>
              <span className="text-white"> in the chat.</span>
            </p>
          </div>
          <div className="flex flex-col bg-[#2c2171] p-4 text-center items-center max-w-xs rounded-3xl">
            {/* <CurrencyDollarIcon className="h-20 w-20 fill-secondary" /> */}
            <TokenLogo width={100} height={100} />
            <p className="text-md md:text-xl">
              <span className="text-white">
                {" "}
                Bet 1 $USDC, and if you guess, you get 3. <br />
              </span>
              <span className="text-[#3DCCE1]">Free version available.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CloseButton = ({ closeModal }: any) => {
  return (
    <div className="flex justify-end md:m-4 ">
      <button className="btn btn-ghost text-black bg-white hover:bg-gray-300" onClick={closeModal}>
        <XMarkIcon className="h-2/3" />
      </button>
    </div>
  );
};

export { CloseButton };
