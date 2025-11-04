"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import UserAvatar from "@/components/UserAvatar";
import { getUserInfo, getReminders } from "@/lib/backendApi";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getUserInfo()
      .then((data) => { setUser(data); setLoading(false); })
      .catch((err) => { setUser(null); setError(err.message); setLoading(false); });
  }, []);

  const fmt = (d) => {
    try { return new Date(d).toLocaleString(); } catch { return "-"; }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  if (error || !user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        {error || "Not authenticated"}. <Link href="/login" className="text-teal-400 ml-2">Login</Link>
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col sm:flex-row">
      {/* Sidebar */}
      <aside className="w-full sm:w-72 bg-gray-800/60 backdrop-blur-sm border-r border-gray-700/40 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <UserAvatar
            userName={user.name}
            userEmail={user.email}
            fallbackInitial={(user.name || "U").charAt(0).toUpperCase()}
          />
          <div>
            <div className="font-semibold">{user.name}</div>
            <div className="text-xs text-gray-400">{user.email}</div>
          </div>
        </div>
        <h2 className="text-xl font-bold mb-4 text-teal-300">Cling Reminder</h2>
        <nav className="flex flex-col gap-3 text-gray-300">
          <Link href="/dashboard" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">Dashboard</Link>
          <Link href="/reminders" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">Reminders</Link>
          <Link href="/reminders/new" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">New Reminder</Link>
          <Link href="/settings" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">Settings</Link>
          <Link href="/support" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">Support</Link>
        </nav>
        <div className="mt-6 border-t border-gray-700/40 pt-4 text-sm text-gray-400 space-y-3">
          <div>Plan: <span className="text-white ml-2">Free</span></div>
          <div>Reminders: <span className="text-teal-300 ml-2">{user.remindersCount ?? "—"}</span></div>
          <div>Last login: <span className="ml-2">{fmt(user.lastLogin) ?? "—"}</span></div>
        </div>
        <div className="flex-1" />
        <div className="mt-4"><LogoutButton /></div>
      </aside>
      {/* Main content */}
      <section className="flex-1 p-6 sm:p-10">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-sky-500">Welcome, {user.name} 👋</h1>
            <p className="mt-1 text-gray-400">Here's a quick look at your reminders and system health.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-gray-800/50 backdrop-blur p-2 rounded-lg border border-gray-700/40">
              <input type="text" placeholder="Search reminders, devices..." className="bg-transparent outline-none px-3 py-1 text-sm text-gray-200 placeholder-gray-400" />
            </div>
            <Link href="/reminders/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-400 to-sky-500 text-gray-900 px-4 py-2 rounded-lg font-medium shadow-lg">+ New Reminder</Link>
          </div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/40 shadow-md">
            <div className="text-sm text-gray-400">Upcoming</div>
            <div className="mt-2 text-2xl font-bold">{user.upcomingCount ?? 0}</div>
            <div className="text-xs text-gray-400 mt-2">Reminders scheduled in next 30 days</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/40 shadow-md">
            <div className="text-sm text-gray-400">Completed</div>
            <div className="mt-2 text-2xl font-bold">{user.completedCount ?? 0}</div>
            <div className="text-xs text-gray-400 mt-2">Total reminders you've completed</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/40 shadow-md">
            <div className="text-sm text-gray-400">Total Reminders</div>
            <div className="mt-2 text-2xl font-bold">{user.remindersCount ?? 0}</div>
            <div className="text-xs text-gray-400 mt-2">All reminders created</div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gray-800/60 p-6 rounded-xl border border-gray-700/40 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Reminders</h3>
              <Link href="/reminders" className="text-sm text-teal-300 hover:underline">View all</Link>
            </div>
            <RecentRemindersClient />
          </div>
          <aside className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/40 shadow-lg">
            <h4 className="font-semibold mb-2">Quick Tips</h4>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>Enable notifications to get timely reminders.</li>
              <li>Use the image suggestion feature to attach helpful images to reminders.</li>
              <li>Sync with calendar for repeat reminders.</li>
            </ul>
            <div className="mt-4 border-t border-gray-700/30 pt-4">
              <h5 className="text-sm text-gray-400 mb-2">Support</h5>
              <Link href="/support" className="text-teal-300 text-sm hover:underline">Contact support</Link>
            </div>
          </aside>
        </div>
        <footer className="mt-10 text-center text-xs text-gray-500">Made with ❤️ • Keep your devices happy</footer>
      </section>
    </main>
  );
}

// --- existing RecentRemindersClient can remain unchanged
function RecentRemindersClient() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getReminders({ limit: 6, sort: "-createdAt" })
      .then((res) => { setReminders(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmt = (d) => {
    try { return new Date(d).toLocaleString(); } catch { return "-"; }
  };

  if (loading) {
    return <div className="text-gray-400">Loading recent reminders...</div>;
  }

  if (!reminders.length) {
    return (
      <div className="text-gray-400">
        No reminders yet. Create one using the {" "}
        <span className="text-teal-300">New Reminder</span> button.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reminders.map((r) => (
        <div
          key={r._id}
          className="flex items-center justify-between p-3 rounded-md bg-gray-900/40 border border-gray-700/30"
        >
          <div>
            <div className="font-semibold">{r.title || "Untitled"}</div>
            <div className="text-xs text-gray-400">
              {(r.device || "General") + " • " + fmt(r.date)}
            </div>
          </div>
          <div className="text-sm text-gray-300">{r.status || "upcoming"}</div>
        </div>
      ))}
    </div>
  );
}