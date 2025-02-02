import { About } from "./About";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "About",
  description: "Built with 🏗 Scaffold-ETH 2",
});

const AboutPage: NextPage = () => {
  return (
    <>
      <About />
    </>
  );
};

export default AboutPage;
