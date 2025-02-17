"use client";

import { TokenLogo } from "~~/components/Header";
import { DECIMALS } from "~~/components/sami/ChooseGame";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

export const Leaderboard = () => {
  const { data: prizeSentEvents } = useScaffoldEventHistory({
    contractName: "TicketSystem",
    eventName: "PrizeSent",
    fromBlock: 0n,
    watch: true,
  });

  // Step 1: Aggregate amounts for each winner
  const aggregatedWinners = prizeSentEvents?.reduce(
    (acc, event) => {
      const winnerAddress = event?.args?.winner;
      const amount = event?.args?.amount ? Number(event.args.amount.toString()) / DECIMALS : 0;

      if (winnerAddress) {
        if (!acc[winnerAddress]) {
          acc[winnerAddress] = 0; // Initialize if the winner is not in the accumulator
        }
        acc[winnerAddress] += amount; // Add the amount to the winner's total
      }

      return acc;
    },
    {} as Record<string, number>,
  ); // Accumulator object to store winner addresses and their total amounts

  // Step 2: Convert the aggregated data into an array and sort by total amount
  const winnersList = aggregatedWinners
    ? Object.entries(aggregatedWinners)
        .map(([winner, totalAmount]) => ({
          winner,
          totalAmount: totalAmount as number,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount) // Sort by totalAmount in descending order
    : [];

  return (
    <div className="flex flex-col items-center justify-start flex-grow mt-4">
      <div className="flex flex-col items-center justify-center card bg-[#2c2171] opacity-80 p-4">
        <h1 className="sami-title text-4xl mb-4">Leaderboard</h1>
        <div className="flex flex-col gap-2 w-auto">
          {/* Table Titles */}
          <div className="grid grid-cols-[1fr,3fr,2fr] gap-2 font-bold">
            <div className="text-center">#</div>
            <div>Address/ENS</div>
            <div className="text-right">
              <TokenLogo />
              &nbsp; Earned
            </div>
          </div>

          {/* Winners List */}
          {winnersList.map((winnerData, index) => (
            <div key={index} className="grid grid-cols-[1fr,3fr,2fr] gap-2">
              <div className="text-center">{index + 1}</div> {/* Ranking Number */}
              <Address address={winnerData.winner} />
              <div className="text-right">{winnerData.totalAmount}&nbsp;</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
