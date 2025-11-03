"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (res.ok) {
        // navigate to login
        router.push("/login");
      } else {
        console.error("Logout failed", await res.text());
        // still navigate to login to force reauth
        router.push("/login");
      }
    } catch (err) {
      console.error("Logout request failed", err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-teal-400 to-sky-500 text-gray-900 font-medium hover:from-teal-300 hover:to-sky-400 transition ${loading ? "opacity-60 cursor-wait" : ""}`}
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
