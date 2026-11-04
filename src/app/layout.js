import Script from "next/script";
import {
  Cormorant_Garamond,
  Fraunces,
  Great_Vibes,
  Outfit,
  Playfair_Display,
  Quicksand,
} from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import AuthGate from "@/components/AuthGate";
import SupabaseBanner from "@/components/SupabaseBanner";
import FloatingHearts from "@/components/FloatingHearts";
import { ToastProvider } from "@/lib/toast";

const quicksand = Quicksand({ variable: "--font-quicksand", subsets: ["latin"] });
const greatVibes = Great_Vibes({ variable: "--font-great-vibes", weight: "400", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", weight: "600", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", weight: "600", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-outfit", weight: "600", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", weight: "600", subsets: ["latin"] });

export const metadata = {
  title: "Us — Our Little World",
  description: "A shared space for two hearts planning life together.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${quicksand.variable} ${greatVibes.variable} ${cormorant.variable} ${playfair.variable} ${outfit.variable} ${fraunces.variable} antialiased`}
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{document.documentElement.dataset.theme=localStorage.getItem('us-theme')||'classic'}catch(e){}`}
        </Script>
        <ToastProvider>
          <FloatingHearts />
          <NavBar />
          <SupabaseBanner />
          <main className="mx-auto max-w-6xl px-4 pb-20 relative">{children}</main>
          <AuthGate />
        </ToastProvider>
      </body>
    </html>
  );
}
