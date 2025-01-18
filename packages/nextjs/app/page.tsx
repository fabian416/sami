"use client";

import type { NextPage } from "next";
import { BugAntIcon, ClockIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">SAMI</span>
          </h1>
          <div className="card bg-base-100 w-96 shadow-xl mt-4">
            <div className="card-body">
              <h2 className="card-title">Enter game!</h2>
              <p>Pay a 2 USDC fee to participate in the next round of SAMI!</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary">Pay 2 USDC</button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-4">
          <h1 className="text-center">
            <span className="block text-2xl font-bold mb-4">About the game</span>
          </h1>
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
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
    </>
  );
};

export default Home;
