import { SocketProvider } from "./socketContext";
import "@rainbow-me/rainbowkit/styles.css";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({ title: "SAMI", description: "Discover the AI and earn, or get rekt" });

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Audiowide&family=Exo+2:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />

        <meta property="og:title" content="SAMI - Play against AI" />
        <meta property="og:description" content="Bet on who do you think is the AI and earn a profit." />
        <meta property="og:image" content="https://playsami.fun/thumbnail.jpg" />
        <meta property="og:url" content="https://playsami.fun" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SAMI" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SAMI - Play against AI" />
        <meta name="twitter:description" content="Bet on who do you think is the AI and earn a profit." />
        <meta name="twitter:image" content="https://playsami.fun/thumbnail.jpg" />
        <meta name="twitter:site" content="@sami_ai_agent" />
      </head>
      <body>
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>
            <SocketProvider>{children}</SocketProvider>
          </ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
