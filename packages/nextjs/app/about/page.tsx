import { About } from "./About";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "About",
  description: "Learn more about SAMI and the game theory behind it.",
});

const AboutPage: NextPage = () => {
  return <About />;
};

export default AboutPage;
