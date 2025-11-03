// src/app/logout/page.jsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

const SETTINGS_KEY = "cling_settings_v2"; // preserved
const AUTH_KEYS = ["auth_token", "token", "user"]; // adapt if you use different keys

export default function LogoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // If user has theme saved, apply it on mount (nice UX)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const theme = JSON.parse(raw).theme;
        if (theme === "dark") document.documentElement.classList.add("dark");
        if (theme === "light") document.documentElement.classList.remove("dark");
        if (theme === "auto") {
          document.documentElement.classList.remove("dark");
          const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
          if (prefersDark) document.documentElement.classList.add("dark");
        }
      }
    } catch (e) {}
  }, []);

  async function doLogout() {
    if (!confirm("Are you sure you want to logout?")) return;
    setLoading(true);
    setMsg("");

    try {
      // call server logout endpoint if exists (clears httpOnly cookie)
      try {
        await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {
        console.warn("Server logout failed or not available:", e);
      }

      // Clear client-side auth keys but KEEP settings
      try {
        AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
      } catch (e) {}

      // Best-effort clear non-httpOnly cookies
      try {
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
      } catch (e) {}

      // show short message then redirect
      setMsg("✓ Logged out — redirecting to login...");
      setTimeout(() => router.push("/login"), 800);
    } catch (err) {
      console.error(err);
      setMsg("Logout failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col sm:flex-row">
      {/* Sidebar (same as settings) */}
      <aside className="w-full sm:w-72 bg-gray-800/60 backdrop-blur-sm border-r border-gray-700/40 p-6">
        <h2 className="text-xl font-bold mb-4 text-teal-300">Cling Reminder</h2>
        <nav className="flex flex-col gap-3 text-gray-300">
          <Link href="/dashboard" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">Dashboard</Link>
          <Link href="/reminders" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">Reminders</Link>
          <Link href="/reminders/new" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">New Reminder</Link>
          <Link href="/settings" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">Settings</Link>
          <Link href="/support" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">Support</Link>
        </nav>

        {/* small footer with quick login link */}
        <div className="mt-6 text-sm text-gray-400">
          Already done? <Link href="/login" className="text-teal-400 hover:underline">Back to Login</Link>
        </div>
      </aside>

      {/* Main */}
      <section className="flex-1 p-6 sm:p-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-sky-500">Logout</h1>
          <p className="mt-1 text-gray-400">You can safely sign out from your account here.</p>
        </header>

        <div className="max-w-4xl space-y-6">
          <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/40">
            <h2 className="text-xl font-semibold mb-4">Confirm Sign Out</h2>

            {msg && (
              <div className="mb-4 p-3 rounded-md text-sm bg-emerald-900/30 text-emerald-300 border border-emerald-800">
                {msg}
              </div>
            )}

            <p className="text-gray-400 mb-6">Click the button below to sign out from this device. Your site theme and language settings will remain saved.</p>

            <div className="flex gap-4 items-center">
              <button
                onClick={doLogout}
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-medium transition ${loading ? "bg-gray-600/50 text-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-teal-400 to-sky-500 text-gray-900 hover:from-teal-300 hover:to-sky-400"}`}
              >
                {loading ? "Signing out..." : "Sign out"}
              </button>

              <Link href="/dashboard" className="px-6 py-3 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-700 transition">Cancel</Link>
            </div>
          </div>

          <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/40">
            <h3 className="font-semibold mb-2">What happens on sign out?</h3>
            <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
              <li>Authentication tokens removed from this browser.</li>
              <li>Your saved theme & language remain in localStorage.</li>
              <li>If your server uses httpOnly cookie, `/api/logout` should clear it (see server code).</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
