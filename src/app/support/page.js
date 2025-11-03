"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SupportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general",
  });
  const [submitted, setSubmitted] = useState(false);

  const AUTH_KEYS = ["auth_token", "token", "user"]; // change if your app uses different keys

  const handleSubmit = (e) => {
    e.preventDefault();
    // place your API call here (fetch/axios)
    setSubmitted(true);

    // reset after 3s (for demo). Remove or adapt in production.
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        category: "general",
      });
    }, 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogout = async () => {
    const ok = confirm("Are you sure you want to logout?");
    if (!ok) return;

    try {
      // optional: call server logout endpoint to clear httpOnly cookie
      try {
        await fetch("/api/logout", { method: "POST", credentials: "include" });
      } catch (e) {
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

      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Logout failed. Check console for details.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col sm:flex-row">
      {/* Sidebar */}
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
            <Link href="/reminders/new" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">
              New Reminder
            </Link>
            <Link href="/settings" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">
              Settings
            </Link>
            <Link href="/support" className="px-3 py-2 rounded-md bg-gray-700 text-teal-300 transition">
              Support
            </Link>
          </nav>
        </div>

        {/* spacer pushes logout to bottom */}
        <div className="flex-1" />

        {/* Logout button placed at bottom of sidebar */}
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
            Support & Contact
          </h1>
          <p className="mt-1 text-gray-400">We're here to help! Reach out to us anytime</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/40">
              <h2 className="text-xl font-semibold mb-4">Send us a message</h2>

              {submitted && (
                <div className="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300">
                  ✓ Message sent successfully! We'll get back to you soon.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your name"
                      className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white placeholder-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Report a Bug</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="What's this about?"
                    className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Tell us more about your question or issue..."
                    className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white placeholder-gray-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-teal-400 to-sky-500 text-gray-900 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* Contact Info & FAQ */}
          <div className="space-y-6">
            {/* Contact Cards */}
            <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/40">
              <h3 className="font-semibold mb-4">Contact Information</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-teal-400 text-xl">📧</span>
                  <div>
                    <div className="font-medium">Email</div>
                    <a href="mailto:support@clingreminder.com" className="text-gray-400 hover:text-teal-400">
                      info@clinginfotech.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-teal-400 text-xl">📞</span>
                  <div>
                    <div className="font-medium">Phone</div>
                    <a href="tel:+911234567890" className="text-gray-400 hover:text-teal-400">
                      +91 8264469132
                    </a>
                  </div>
                </div>

                <div>
                  <div className="flex items-start gap-3">
                    <span className="text-teal-400 text-xl">📍</span>
                    <div>
                      <div className="font-medium">Noida Address</div>
                      <div className="text-gray-400">
                        2nd Floor-130,131,132, Wave Galleria
                        <br />
                        Wave City, NH-24, UP-201010
                        <br />
                        India
                      </div>
                    </div>
                  </div>

                </div>

                <div className="flex items-start gap-3">
                  <span className="text-teal-400 text-xl">⏰</span>
                  <div>
                    <div className="font-medium">Business Hours</div>
                    <div className="text-gray-400">
                      Mon - Fri: 9:00 AM - 6:00 PM IST
                      <br />
                      Sat: 10:00 AM - 2:00 PM IST
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/40">
              <h3 className="font-semibold mb-4">Follow Us</h3>
              <div className="flex gap-3">
                <a href="#" aria-label="X (Twitter)" className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center hover:bg-teal-500/20 transition">
                  <span className="text-xl">𝕏</span>
                </a>
                <a href="#" aria-label="LinkedIn" className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center hover:bg-teal-500/20 transition">
                  <span className="text-xl">in</span>
                </a>
                <a href="#" aria-label="Facebook" className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center hover:bg-teal-500/20 transition">
                  <span className="text-xl">f</span>
                </a>
                <a href="#" aria-label="Instagram" className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center hover:bg-teal-500/20 transition">
                  <span className="text-xl">📷</span>
                </a>
              </div>
            </div>

            {/* Quick Help */}
            <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/40">
              <h3 className="font-semibold mb-4">Quick Help</h3>
              <div className="space-y-2 text-sm">
                <Link href="/docs" className="block text-teal-400 hover:underline">
                  📚 Documentation
                </Link>
                <Link href="/faq" className="block text-teal-400 hover:underline">
                  ❓ FAQ
                </Link>
                <Link href="/api" className="block text-teal-400 hover:underline">
                  🔌 API Reference
                </Link>
                <Link href="/community" className="block text-teal-400 hover:underline">
                  💬 Community Forum
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-10 max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="bg-gray-800/60 p-5 rounded-xl border border-gray-700/40">
              <summary className="font-semibold cursor-pointer">How do I create a reminder?</summary>
              <p className="mt-3 text-gray-400 text-sm">
                Click on the "+ New Reminder" button in the dashboard or navigation menu. Fill in the details like title, date, device, and category, then click "Create Reminder".
              </p>
            </details>

            <details className="bg-gray-800/60 p-5 rounded-xl border border-gray-700/40">
              <summary className="font-semibold cursor-pointer">Can I set recurring reminders?</summary>
              <p className="mt-3 text-gray-400 text-sm">
                Yes! When creating a reminder, select the "Repeat" option and choose daily, weekly, monthly, or yearly intervals.
              </p>
            </details>

            <details className="bg-gray-800/60 p-5 rounded-xl border border-gray-700/40">
              <summary className="font-semibold cursor-pointer">How do I enable notifications?</summary>
              <p className="mt-3 text-gray-400 text-sm">
                Go to Settings → Notifications and toggle on "Push Notifications". Make sure your browser allows notifications from our site.
              </p>
            </details>

            <details className="bg-gray-800/60 p-5 rounded-xl border border-gray-700/40">
              <summary className="font-semibold cursor-pointer">Is there a mobile app?</summary>
              <p className="mt-3 text-gray-400 text-sm">
                Currently, Cling Reminder is web-based and fully responsive on mobile browsers. A native mobile app is in development!
              </p>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}
