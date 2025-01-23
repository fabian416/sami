import { CloseButton } from "./ModalInstructions";
import { NoSymbolIcon } from "@heroicons/react/24/outline";

export const ModalEliminated = ({ closeModal }: any) => {
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // Verifica si el clic fue fuera del contenido del modal
    if (event.target === event.currentTarget) {
      closeModal();
    }
  };
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-base-300 rounded-2xl items-center justify-center">
        <CloseButton closeModal={closeModal} />
        <div className="flex items-center justify-center text-center flex-col gap-2 px-8 pb-8">
          <span>You were eliminated</span>
          <div className="w-16 h-16">
            <NoSymbolIcon />
          </div>
        </div>
      </div>
    </div>
  );
};
