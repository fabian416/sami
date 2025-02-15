"use client";

// import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export const About = () => {
  return (
    <div className="flex flex-col items-center justify-center flex-grow">
      <div className="hero">
        <div className="hero-content flex-col lg:flex-row-reverse lg:px-14 text-xl">
          <Image src="/logo.png" alt="SAMI logo" className="max-w-sm mx-3" width={300} height={300} />
          <div>
            <h1 className="text-5xl sami-title">Who is SAMI? 🤖</h1>
            <p className="pt-6">
              SAMI is a rogue AI that wants to blend in as a human. The game is about{" "}
              <strong className="text-[#34CEE0]">guessing who&apos;s an AI</strong> on a group chat after two minutes of
              conversation.
            </p>
            <p>
              Our goal is to{" "}
              <strong className="text-[#34CEE0]">enhance the Turing test by introducing economic incentives</strong>.
              Training AI can be both fun and addictive when participants engage in a betting game that actively trains
              an AI agent.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full  bg-[#DAFB08]">
        <div className="flex flex-col p-6 justify-center items-center  bg-[#DAFB08] text-black">
          <h1 className="text-4xl font-mono text-center">Curious about our game theory?</h1>
          <div>
            <Link href="/SAMIpaper.pdf" target="_blank">
              <button className="btn btn-primary bg-black hover:bg-gray-800 border-0 text-[#DAFB08]">
                Read our SAMIPaper!
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="hero bg-base-200">
        <div className="hero-content flex-col lg:flex-row-reverse lg:px-14">
          {/* INSERT HERE A GIF SHOWING HOW A LIKE BECOMES MONEY */}
          <div className="flex flex-col items-center justify-center">
            <div className="hero-content flex-col lg:flex-row-reverse ">
              <Image
                src="/avatar/2.png"
                alt="A dollar bill traveling from one phone to another"
                className="max-w-sm rounded-lg shadow-2xl mx-3"
                width={300}
                height={300}
              />
              <div>
                <h1 className="text-4xl font-bold">About the game 🤖</h1>

                <p className=" text-green-600 text-2xl">Bet, guess and win! 🤑</p>
                <p className="">
                  Earn by guessing correctly who&apos;s the AI 💰 <br />
                  Your guesses help train the AI 🫂
                </p>
                {/* <button className="btn btn-primary">Get Started</button> */}
                <p className="pt-4 text-center italic">
                  This website is a game where you can optionally bet on who&apos;s the AI on a chat room.
                </p>
                <div className="flex justify-center">
                  <Link href="/game" className="">
                    <button className="cool-button">Play now!</button>
                  </Link>
                </div>
              </div>
            </div>

            {/* <hr className="w-full border-2 border-white mb-6" /> */}
          </div>
        </div>
      </div>

      <div className="w-full pt-6 bg-base-100">
        <h1 className="text-4xl font-mono text-center">Meet the team! 🤖</h1>
      </div>
      <div className="hero bg-base-100 ">
        <div className="hero-content flex-col md:flex-row">
          <div className="flex flex-col  items-center gap-3 bg-base-100 rounded-lg border-2">
            <figure className="px-10 pt-5 flex-shrink-0">
              <Image src="/lulox.jpg" alt="Lulox" className="rounded-xl" width={200} height={200} />
            </figure>
            <div className="flex pb-5 flex-col items-center justify-center">
              <h2 className="text-3xl">Lulox</h2>
              <span className="italic">Fullstack Developer</span>
              <a
                className="flex justify-center items-center gap-1"
                href="https://linktr.ee/lulox"
                target="_blank"
                rel="noreferrer"
              >
                <button className="btn btn-success mt-2">Linktree</button>
              </a>
            </div>
          </div>

          <div className="flex flex-col  items-center gap-3 bg-base-100 rounded-lg border-2">
            <figure className="px-10 pt-5 flex-shrink-0">
              <Image src="/fabian.jpg" alt="Fabián Díaz" className="rounded-xl" width={200} height={200} />
            </figure>
            <div className="flex pb-5 flex-col items-center justify-center">
              <h2 className="text-3xl">Fabián Díaz</h2>
              <span className="italic">Fullstack Developer</span>
              <a
                className="flex justify-center items-center gap-1"
                href="https://x.com/Fabian_diaz222"
                target="_blank"
                rel="noreferrer"
              >
                <button className="btn btn-success mt-2">Contact</button>
              </a>
            </div>
          </div>

          <div className="flex flex-col  items-center gap-3 bg-base-100 rounded-lg border-2">
            <figure className="px-10 pt-5 flex-shrink-0">
              <Image src="/lucho.jpg" alt="Luciano Carreño" className="rounded-xl" width={200} height={200} />
            </figure>
            <div className="flex pb-5 flex-col items-center justify-center">
              <h2 className="text-3xl">Luciano Carreño</h2>
              <span className="italic">Fullstack Developer</span>
              <a
                className="flex justify-center items-center gap-1"
                href="https://x.com/lucho_leonel1"
                target="_blank"
                rel="noreferrer"
              >
                <button className="btn btn-success mt-2">Contact</button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
