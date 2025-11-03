"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Modal, message } from "antd";
import "antd/dist/reset.css";

export default function RemindersPage() {
  const [user, setUser] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);

  
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/dashboard/userinfo").then((r) => r.ok ? r.json() : null),
      fetch("/api/reminders").then((r) => r.ok ? r.json() : { data: [] })
    ])
      .then(([user, remindersRes]) => {
        setUser(user);
        setReminders(remindersRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Not authenticated");
        setLoading(false);
      });
  }, []);

  const triggerDelete = (id) => {
    setToDeleteId(id);
    setIsModalOpen(true);
  };
  const handleDelete = () => {
    if (!toDeleteId) return;
    fetch(`/api/reminders/${toDeleteId}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) {
          setReminders(reminders.filter((r) => r._id !== toDeleteId));
          message.success("Reminder deleted");
        } else {
          message.error("Failed to delete reminder");
        }
      })
      .catch(() => message.error("Failed to delete reminder"))
      .finally(() => {
        setIsModalOpen(false);
        setToDeleteId(null);
      });
  };

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
      
      <aside className="w-full sm:w-72 bg-gray-800/60 backdrop-blur-sm border-r border-gray-700/40 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-gray-900 font-bold">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">{user?.name}</div>
            <div className="text-xs text-gray-400">{user?.email}</div>
          </div>
        </div>
        <h2 className="text-xl font-bold mb-4 text-teal-300">Cling Reminder</h2>
        <nav className="flex flex-col gap-3 text-gray-300">
          <Link href="/dashboard" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">Dashboard</Link>
          <Link href="/reminders" className="px-3 py-2 rounded-md bg-gray-700 text-teal-300 transition">Reminders</Link>
          <Link href="/reminders/new" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">New Reminder</Link>
          <Link href="/settings" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">Settings</Link>
          <Link href="/support" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">Support</Link>
        </nav>
        <div className="mt-6 border-t border-gray-700/40 pt-4 text-sm text-gray-400 space-y-3">
          <div>Plan: <span className="text-white ml-2">Free</span></div>
          <div>Reminders: <span className="text-teal-300 ml-2">{reminders.length}</span></div>
          <div>Last login: <span className="ml-2">{fmt(user?.lastLogin) ?? '—'}</span></div>
        </div>
      </aside>
      
      <section className="flex-1 p-6 sm:p-10">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-sky-500">All Reminders</h1>
            <p className="mt-1 text-gray-400">Manage and track all your device reminders</p>
          </div>
          <Link href="/reminders/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-400 to-sky-500 text-gray-900 px-4 py-2 rounded-lg font-medium shadow-lg">+ New Reminder</Link>
        </header>
        
        <div className="flex gap-3 mb-6 flex-wrap">
          <button className="px-4 py-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">All ({reminders.length})</button>
          <button className="px-4 py-2 rounded-lg bg-gray-800/60 text-gray-300 hover:bg-gray-700 border border-gray-700/40">Upcoming</button>
          <button className="px-4 py-2 rounded-lg bg-gray-800/60 text-gray-300 hover:bg-gray-700 border border-gray-700/40">Completed</button>
          <button className="px-4 py-2 rounded-lg bg-gray-800/60 text-gray-300 hover:bg-gray-700 border border-gray-700/40">Overdue</button>
        </div>
        
        {reminders.length === 0 ? (
          <div className="bg-gray-800/60 p-12 rounded-xl border border-gray-700/40 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">No reminders yet</h3>
            <p className="text-gray-400 mb-6">Create your first reminder to get started</p>
            <Link href="/reminders/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-400 to-sky-500 text-gray-900 px-6 py-3 rounded-lg font-medium shadow-lg">+ Create Reminder</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div key={reminder._id} className="bg-gray-800/60 p-5 rounded-xl border border-gray-700/40 hover:border-teal-500/30 transition-all shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{reminder.title || 'Untitled Reminder'}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        reminder.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                        reminder.status === 'overdue' ? 'bg-red-500/20 text-red-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {reminder.status || 'upcoming'}
                      </span>
                    </div>
                    {reminder.description && (
                      <p className="text-gray-400 text-sm mb-3">{reminder.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2"><span>📅</span><span>{fmt(reminder.date)}</span></div>
                      {reminder.device && (<div className="flex items-center gap-2"><span>🖥️</span><span>{reminder.device}</span></div>)}
                      {reminder.category && (<div className="flex items-center gap-2"><span>🏷️</span><span>{reminder.category}</span></div>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/reminders/${reminder._id}/edit`} className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition">✏️</Link>
                    <button className="p-2 rounded-lg bg-gray-700/50 hover:bg-red-500/20 text-gray-300 hover:text-red-300 transition" onClick={() => triggerDelete(reminder._id)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Modal
        title="Delete Reminder"
        open={isModalOpen}
        onOk={handleDelete}
        onCancel={() => setIsModalOpen(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
      >
        <p>Are you sure you want to delete this reminder? This action cannot be undone.</p>
      </Modal>
    </main>
  );
}