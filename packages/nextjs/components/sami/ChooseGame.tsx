export const ChooseGame = ({ showGame }: any) => {
  return (
    <>
      <div className="flex flex-direction-row justify-evenly w-full">
        <div className="card bg-base-100 w-96 shadow-xl mt-4 mx-2">
          <div className="card-body">
            <h2 className="card-title">Enter game!</h2>
            <p>Pay a 2 USDC fee to participate in the next round of SAMI!</p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary">Pay 2 USDC</button>
            </div>
          </div>
        </div>
        <div className="card dark:bg-cyan-700 light:bg-white-100 w-96 shadow-xl mt-4 mx-2">
          <div className="card-body">
            <h2 className="card-title">Enter free game!</h2>
            <p>Participate free in the next round of SAMI!</p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary" onClick={showGame}>
                Enter
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
