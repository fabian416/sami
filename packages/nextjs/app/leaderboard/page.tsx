import { Leaderboard } from "./Leaderboard";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Leaderboard",
  description: "Built with 🏗 Scaffold-ETH 2",
});

const AboutPage: NextPage = () => {
  return (
    <>
      <Leaderboard />
    </>
  );
};

export default AboutPage;
