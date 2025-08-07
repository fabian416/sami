import { SocketProvider } from "../providers/SocketContext";
import "@rainbow-me/rainbowkit/styles.css";
import { EthAppWithProviders } from "~~/providers/EthAppWithProviders";
import { ThemeProvider } from "~~/providers/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "SAMI - Play against AI",
  description: "Bet on who do you think is the AI and earn a profit.",
  imageRelativePath: "/thumbnail.jpg",
});

const App = ({ children }: { children: React.ReactNode }) => {
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
      </head>
      <body className="min-h-screen">
        <ThemeProvider enableSystem>
          <EthAppWithProviders>{children}</EthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default App;
