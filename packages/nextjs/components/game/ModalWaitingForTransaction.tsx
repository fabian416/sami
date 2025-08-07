export const ModalWaitingForTransaction = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#1CA297] glow-cyan text-white rounded-2xl items-center justify-center p-8">
        <div className="flex items-center justify-center text-center flex-col gap-6">
          <span className="text-[#2c2171]">
            <strong className="text-xl">Follow steps and wait...</strong>
          </span>
          <div className="flex items-center justify-center gap-4 flex-row">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#2c2171] border-solid"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
