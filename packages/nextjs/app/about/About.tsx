"use client";

import Image from "next/image";
import Link from "next/link";

export const About = () => {
  return (
    <div className="flex flex-col items-center justify-center flex-grow">
      {/* Section 1: About the Game */}
      <div className="hero">
        <div className="hero-content flex-col lg:flex-row-reverse lg:px-14 text-xl">
          <Image
            src="/logo.png"
            alt="SAMI logo - A futuristic AI logo"
            className="max-w-sm mx-3"
            width={300}
            height={300}
          />
          <div>
            <h1 className="text-5xl sami-title">About the Game 🤖</h1>
            <p className="pt-6">
              This website is a game where you can optionally bet on who&apos;s the AI in a chat room. Players engage in
              a social deduction challenge where they must determine if they are chatting with an AI or a human.
            </p>
            <p>
              Earn rewards by making the right call!{" "}
              <strong className="text-[#34CEE0]">Your guesses actively train the AI</strong>, improving its ability to
              mimic human behavior.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Game Theory Call-to-Action */}
      <div className="w-full bg-[#DAFB08]">
        <div className="flex flex-col p-6 justify-center items-center bg-[#DAFB08] text-black">
          <h1 className="text-4xl font-mono text-center">Curious about our game theory?</h1>
          <div>
            <Link href="/SAMIpaper.pdf" target="_blank">
              <button
                className="btn btn-primary bg-black hover:bg-gray-800 border-0 text-[#DAFB08]"
                aria-label="Read the SAMI paper"
              >
                Read our SAMIPaper!
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Section 3: Who is SAMI? */}
      <div className="hero bg-base-200 opacity-80">
        <div className="hero-content flex-col lg:flex-row-reverse lg:px-14">
          <div className="flex flex-col items-center justify-center">
            <div className="hero-content flex-col lg:flex-row-reverse">
              <Image
                src="/avatar/2.jpg"
                alt="Avatar of a SAMI impostor"
                className="max-w-sm rounded-lg shadow-2xl mx-3"
                width={300}
                height={300}
              />
              <div>
                <h1 className="text-4xl font-bold">Who is SAMI? 🤖</h1>
                <p className="text-green-600 text-2xl">A rogue AI trying to blend in! 🕵️</p>
                <p className="">
                  SAMI is an advanced AI that aims to pass as human in group chats. Players must
                  <strong className="text-[#34CEE0]"> guess who&apos;s an AI</strong> after two minutes of conversation.
                </p>
                <p className="pt-4 text-center italic">
                  By participating, you&apos;re contributing to the evolution of AI while engaging in a fun and
                  rewarding challenge.
                </p>
                <div className="flex justify-center">
                  <Link href="/">
                    <button className="cool-button">Play now!</button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: RLHF and Turing Test */}
      <div className="hero bg-base-300 opacity-80">
        <div className="hero-content flex-col lg:flex-row-reverse lg:px-14">
          <div className="flex flex-col items-center justify-center">
            <div className="hero-content flex-col lg:flex-row-reverse">
              <div>
                <h1 className="text-4xl font-bold">RLHF and the Turing Test 🧠</h1>
                <p className="pt-6">
                  SAMI leverages{" "}
                  <strong className="text-[#34CEE0]">Reinforcement Learning from Human Feedback (RLHF)</strong> to
                  improve its ability to mimic human behavior. By analyzing player interactions and feedback, SAMI
                  continuously evolves to become more convincing.
                </p>
                <p className="pt-4">
                  The <strong className="text-[#34CEE0]">Turing Test</strong>, proposed by Alan Turing in 1950,
                  evaluates a machine&apos;s ability to exhibit intelligent behavior indistinguishable from a human.
                  SAMI takes this a step further by integrating{" "}
                  <strong className="text-[#34CEE0]">economic incentives</strong>, making the test more engaging and
                  impactful.
                </p>
                <p className="pt-4 italic">
                  Can you tell the difference between a human and an AI?{" "}
                  <Link className="link" href="/">
                    Play SAMI and find out!
                  </Link>
                </p>
              </div>
              <Image
                src="/robot-running.gif"
                alt="Robot starting to look like a human - A visual representation of AI evolution"
                className="max-w-sm rounded-lg shadow-2xl mx-3"
                width={300}
                height={300}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Meet the Team */}
      <div className="w-full pt-6">
        <h1 className="text-4xl font-mono text-center">Meet the team! 🤖</h1>
      </div>
      <div className="hero">
        <div className="hero-content flex-col md:flex-row gap-9">
          {[
            {
              name: "Lulox",
              role: "Fullstack Developer",
              image: "/lulox.jpg",
              link: "https://linktr.ee/lulox",
            },
            {
              name: "Fabián Díaz",
              role: "Fullstack Developer",
              image: "/fabian.jpg",
              link: "https://x.com/Fabian_diaz222",
            },
            {
              name: "Luciano Carreño",
              role: "Fullstack Developer",
              image: "/lucho.jpg",
              link: "https://x.com/lucho_leonel1",
            },
          ].map((member, index) => (
            <div key={index} className="flex flex-col items-center gap-3 bg-base-100 rounded-lg border-2">
              <figure className="px-10 pt-5 flex-shrink-0">
                <Image src={member.image} alt={member.name} className="rounded-xl" width={200} height={200} />
              </figure>
              <div className="flex pb-5 flex-col items-center justify-center">
                <h2 className="text-3xl">{member.name}</h2>
                <span className="italic">{member.role}</span>
                <a
                  className="flex justify-center items-center gap-1"
                  href={member.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  <button className="btn btn-success mt-2">Contact</button>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
