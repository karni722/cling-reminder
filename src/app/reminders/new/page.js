"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewReminderPage() {
  const router = useRouter();
  
  // --- NEW AI STATES AND FIELD ADDED ---
  const [imageSuggestions, setImageSuggestions] = useState([]); // Stores the URLs from AI
  const [isGenerating, setIsGenerating] = useState(false); // AI loading state
  // ------------------------------------

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    device: "",
    category: "",
    priority: "medium",
    repeatType: "none",
    icon_image_url: "" // NEW FIELD to store the selected image URL
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null); // { type: 'error'|'success', text: string }

  function showToast(type, text, durationMs = 4000) {
    setToast({ type, text });
    if (durationMs > 0) setTimeout(() => setToast(null), durationMs);
  }

  const AUTH_KEYS = ["auth_token", "token", "user"]; // adapt if your app uses different keys

  // --- NEW AI IMAGE GENERATION FUNCTION ---
  const handleGenerateImages = async () => {
    const description = formData.description;
    if (!description.trim()) {
      setError('Please enter a description first to get AI suggestions.');
      return;
    }

    setIsGenerating(true);
    setError(""); // Clear error before new attempt
    setImageSuggestions([]); // Clear previous suggestions
    setFormData(prev => ({ ...prev, icon_image_url: "" })); // Clear selected image

    try {
      const { generateImage } = await import("@/lib/backendApi");
      // Ask for approx 10 suggestions
      const data = await generateImage({ prompt: description, width: 1024, height: 1024, samples: 10, cfg_scale: 7 });
      const urls = Array.isArray(data?.urls) ? data.urls : [];
      if (!urls.length) {
        setError("No image returned from Stability.");
        showToast('error', 'No image returned from Stability');
        return;
      }
      setImageSuggestions(urls);
    } catch (err) {
      console.error('AI Generation Fetch Error:', err);
      const msg = (err?.response?.data?.detail?.message) || (err?.response?.data?.error) || err?.message || 'Could not connect to the AI service.';
      setError(msg);
      showToast('error', msg);
    } finally {
      setIsGenerating(false);
    }
  };
  // ----------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { createReminder } = await import("@/lib/backendApi");
      await createReminder(formData);
      router.push("/reminders");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ---------- Logout logic (No changes here) ----------
  const handleLogout = async () => {
    const ok = confirm("Are you sure you want to logout?");
    if (!ok) return;

    try {
      // optional: call server logout endpoint to clear httpOnly cookie
      try {
        await fetch("/api/logout", { method: "POST", credentials: "include" });
      } catch (e) {
        // ignore server errors here (still proceed with client-side clear)
        console.warn("Server logout failed (ignored):", e);
      }

      // clear client-side auth keys (do NOT remove settings)
      try {
        AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        console.warn("localStorage clear error", e);
      }

      // best-effort clear non-httpOnly cookies
      try {
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
      } catch (e) {}

      // redirect to login
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Logout failed. Check console for details.");
    }
  };
  // ------------------------------------

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col sm:flex-row">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border ${toast.type === 'error' ? 'bg-rose-900/70 border-rose-700 text-rose-100' : 'bg-emerald-900/70 border-emerald-700 text-emerald-100'}`}>
          {toast.text}
        </div>
      )}
      {/* Sidebar (No changes here) */}
      <aside className="w-full sm:w-72 bg-gray-800/60 backdrop-blur-sm border-r border-gray-700/40 p-6 flex flex-col">
        <div>
          <h2 className="text-xl font-bold mb-4 text-teal-300">Cling Reminder</h2>
          <nav className="flex flex-col gap-3 text-gray-300">
            <Link href="/dashboard" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">
              Dashboard
            </Link>
            <Link href="/reminders" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">
              Reminders
            </Link>
            <Link href="/reminders/new" className="px-3 py-2 rounded-md bg-gray-700 text-teal-300 transition">
              New Reminder
            </Link>
            <Link href="/settings" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">
              Settings
            </Link>
            <Link href="/support" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">
              Support
            </Link>
          </nav>
        </div>

        {/* spacer to push logout to bottom */}
        <div className="flex-1" />

        {/* Logout button at bottom */}
        <div className="mt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-teal-400 to-sky-500 text-gray-900 font-medium hover:from-teal-300 hover:to-sky-400 transition"
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M3 4.5A1.5 1.5 0 014.5 3h6A1.5 1.5 0 0112 4.5v2a.75.75 0 01-1.5 0v-2a.0.5.0 00-.5-.5h-6a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h6c.28 0 .5-.22.5-.5v-2a.75.75 0 011.5 0v2A1.5 1.5 0 0110.5 17h-6A1.5 1.5 0 013 15.5v-11z" clipRule="evenodd" />
              <path d="M14.47 10.47a.75.75 0 010-1.06l2.5-2.5a.75.75 0 111.06 1.06L16.06 9.5H9.5a.75.75 0 010-1.5h6.56l1.97-1.97a.75.75 0 111.06 1.06l-2.5 2.5z" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <section className="flex-1 p-6 sm:p-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-sky-500">
            Create New Reminder
          </h1>
          <p className="mt-1 text-gray-400">Set up a new reminder for your device</p>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-3xl">
          <div className="space-y-6">
            {/* Title */}
            <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/40">
              <label className="block text-sm font-medium mb-2">Reminder Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Clean laptop fan"
                className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white placeholder-gray-500"
              />
            </div>

            {/* Description and AI Suggestions */}
            <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/40">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Add more details about this reminder..."
                className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white placeholder-gray-500"
              />

              {/* --- NEW AI BUTTON AND SUGGESTIONS START --- */}
              <div className="mt-4">
                  <button 
                      type="button" 
                      onClick={handleGenerateImages} 
                      disabled={isGenerating || !formData.description.trim()}
                      className="px-4 py-2 text-sm rounded-md font-medium transition-all shadow-md"
                      style={{
                          backgroundColor: isGenerating ? '#374151' : '#10b981', // Tailwind green-600/700 shade
                          color: isGenerating ? '#9ca3af' : 'white',
                          cursor: isGenerating ? 'not-allowed' : 'pointer'
                      }}
                  >
                      {isGenerating ? 'Gemini Icons Generate Kar Raha Hai...' : 'AI Icon Suggest Karo'}
                  </button>
              </div>

              {imageSuggestions.length > 0 && (
                  <div className="mt-6">
                      <h4 className="text-sm font-medium mb-3 text-teal-300">Suggested Icons (Click to Select):</h4>
                      <div className="flex gap-4 overflow-x-auto p-2">
                          {imageSuggestions.map((url, index) => (
                              <img 
                                  key={index}
                                  src={url}
                                  alt={`AI Icon ${index + 1}`}
                                  onClick={() => setFormData(prev => ({ ...prev, icon_image_url: url }))} // URL ko form data mein save kiya
                                  className={`flex-shrink-0 w-20 h-20 object-cover rounded-lg transition-all cursor-pointer ${
                                      formData.icon_image_url === url 
                                          ? 'border-4 border-teal-400 ring-2 ring-teal-600 shadow-lg shadow-teal-500/50' 
                                          : 'border-4 border-transparent hover:border-gray-600'
                                  }`}
                                  title={url && url.includes('text=') ? decodeURIComponent(url.split('text=')[1].replace(/\+/g, ' ')) : 'Generated image'}
                              />
                          ))}
                      </div>
                      {formData.icon_image_url && (
                          <p className="mt-3 text-xs text-teal-300">✅ Icon Selected!</p>
                      )}
                  </div>
              )}
              {/* --- NEW AI BUTTON AND SUGGESTIONS END --- */}
            </div>
            {/* End of Description & AI Suggestions */}

            {/* Date & Time (No changes here) */}
            <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/40">
              <label className="block text-sm font-medium mb-4">When? *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Time</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Device & Category (No changes here) */}
            <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Device</label>
                  <select
                    name="device"
                    value={formData.device}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white"
                  >
                    <option value="">Select device</option>
                    <option value="laptop">Laptop</option>
                    <option value="phone">Phone</option>
                    <option value="tablet">Tablet</option>
                    <option value="desktop">Desktop</option>
                    <option value="smartwatch">Smartwatch</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white"
                  >
                    <option value="">Select category</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="update">Update</option>
                    <option value="backup">Backup</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="battery">Battery Check</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Priority & Repeat (No changes here) */}
            <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Repeat</label>
                  <select
                    name="repeatType"
                    value={formData.repeatType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white"
                  >
                    <option value="none">No repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-teal-400 to-sky-500 text-gray-900 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Reminder"}
              </button>
              <Link
                href="/reminders"
                className="px-8 py-3 bg-gray-800 border border-gray-700/40 rounded-lg font-medium hover:bg-gray-700 transition-all text-center"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}