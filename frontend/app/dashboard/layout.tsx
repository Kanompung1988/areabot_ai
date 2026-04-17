"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Home, Inbox, Calendar, Search, Settings } from "lucide-react";
import clsx from "clsx";
import TobTanIcon from "@/components/TobTanIcon";

const NAV_ICONS = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/inbox", icon: Inbox, label: "Inbox" },
  { href: "/dashboard/calendar", icon: Calendar, label: "Calendar" },
  { href: "/dashboard/search", icon: Search, label: "Search" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const token = Cookies.get("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    setUserName(Cookies.get("user_name") || "U");
  }, []);

  const initials = userName
    ? userName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="h-screen flex overflow-hidden bg-[#f5f5f5]">
      {/* ── Icon sidebar ── */}
      <aside className="icon-sidebar flex-shrink-0">
        {/* Logo */}
        <Link href="/dashboard">
          <div className="flex items-center justify-center w-10 h-10 bg-[#1a1a1a] rounded-xl mb-3 hover:opacity-90 transition-opacity cursor-pointer">
            <TobTanIcon size={18} invert />
          </div>
        </Link>

        {/* Nav icons */}
        <div className="flex flex-col gap-1 flex-1">
          {NAV_ICONS.map(({ href, icon: Icon, label }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link key={href} href={href} title={label}>
                <button
                  className={clsx("icon-sidebar-btn", active && "active")}
                  aria-label={label}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{label}</span>
                </button>
              </Link>
            );
          })}
        </div>

        {/* Bottom: settings + avatar */}
        <div className="flex flex-col items-center gap-1 pb-2">
          <Link href="/dashboard/bots" title="Bots">
            <button
              className={clsx(
                "icon-sidebar-btn",
                pathname.startsWith("/dashboard/bots") && "active",
              )}
              aria-label="Settings"
            >
              <Settings size={18} strokeWidth={1.8} />
              <span>ตั้งค่า</span>
            </button>
          </Link>
          <button
            title={`${userName} — ออกจากระบบ`}
            onClick={() => {
              Cookies.remove("access_token");
              Cookies.remove("user_name");
              router.push("/login");
            }}
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-gray-300 transition-colors mt-1"
          >
            {initials}
          </button>
        </div>
      </aside>

      {/* ── Page content ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
    </div>
  );
}
