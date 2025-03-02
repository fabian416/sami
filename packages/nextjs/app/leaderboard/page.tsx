import { Leaderboard } from "./Leaderboard";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Leaderboard",
  description: "Check the top SAMI players and their earnings.",
});

const AboutPage: NextPage = () => {
  return (
    <>
      <Leaderboard />
    </>
  );
};

export default AboutPage;
