"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarDays, Coins, Gamepad2, Heart, LampDesk, ListTodo, LogOut, Mail, Map, Sparkles, Timer } from "lucide-react";
import { usePeople } from "@/lib/people";
import ThemePicker from "./ThemePicker";

const links = [
  { href: "/", label: "Today", icon: ListTodo },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/future", label: "Future", icon: Sparkles },
  { href: "/money", label: "Money", icon: Coins },
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/works", label: "Works", icon: LampDesk },
  { href: "/letters", label: "Letters", icon: Mail },
  { href: "/trips", label: "Trips", icon: Map },
  { href: "/play", label: "Play", icon: Gamepad2 },
];

export default function NavBar() {
  const pathname = usePathname();
  const { me, partner, signOut } = usePeople();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Heart className="fill-rose-deep text-rose-deep" size={26} />
          <span className="font-romantic text-3xl text-wine leading-none pt-1">Us</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  active ? "text-on-accent" : "text-wine hover:bg-blush"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-rose-deep rounded-full shadow"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon size={15} />
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {me && (
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="px-3 py-1 rounded-full bg-blush text-wine font-semibold">
                {me.emoji} {me.name}
              </span>
              <Heart size={13} className="fill-rose text-rose" />
              <span className="px-3 py-1 rounded-full bg-blush text-wine font-semibold">
                {partner ? `${partner.emoji} ${partner.name}` : "…"}
              </span>
            </div>
          )}
          {me && (
            <button
              onClick={signOut}
              title="Sign out"
              className="p-2 rounded-full text-rose-deep/70 hover:bg-blush hover:text-rose-deep transition-colors"
            >
              <LogOut size={16} />
            </button>
          )}
          <ThemePicker />
        </div>
      </div>
    </header>
  );
}
