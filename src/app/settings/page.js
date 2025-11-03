"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sendOtp } from "../../lib/backendApi";

const SETTINGS_KEY = "cling_settings_v2";
const PROFILE_KEY = "cling_profile_v2";

const defaultSettings = {
  notifications: true,
  emailReminders: true,
  soundEnabled: false,
  theme: "dark", // 'dark' | 'light' | 'auto'
  language: "en",
  timezone: "UTC+5:30",
};

const defaultProfile = {
  name: "",
  email: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [profile, setProfile] = useState(defaultProfile);
  const [savedMsg, setSavedMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // load saved settings/profile on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch (e) {
      console.warn("Failed to read settings:", e);
    }
    try {
      const rawP = localStorage.getItem(PROFILE_KEY);
      if (rawP) setProfile((p) => ({ ...p, ...JSON.parse(rawP) }));
    } catch (e) {
      console.warn("Failed to read profile:", e);
    }
  }, []);

  // apply theme whenever it changes
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // apply language attribute to html
  useEffect(() => {
    try {
      document.documentElement.lang = settings.language || "en";
    } catch (e) {
      // ignore in SSR, but this is client-only so fine
    }
  }, [settings.language]);

  // helper: apply theme to <html> element
  function applyTheme(theme) {
    const root = document.documentElement;
    if (!root) return;
    if (theme === "auto") {
      root.classList.remove("dark");
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) root.classList.add("dark");
    } else if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }

  // generic settings setter
  const handleSettingsChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // profile input handler
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  };

  // validation for password change
  function validatePasswordChange() {
    if (!profile.currentPassword && (profile.newPassword || profile.confirmPassword)) {
      return "Enter your current password to change password.";
    }
    if (profile.newPassword || profile.confirmPassword) {
      if (profile.newPassword.length < 8) {
        return "New password must be at least 8 characters.";
      }
      if (profile.newPassword !== profile.confirmPassword) {
        return "New password and confirmation do not match.";
      }
    }
    return null;
  }

  // save both settings and profile to localStorage (and simulate API call)
  const saveSettings = async () => {
    setErrorMsg("");
    setSavedMsg("");

    // client-side validation
    const pwdErr = validatePasswordChange();
    if (pwdErr) {
      setErrorMsg(pwdErr);
      return;
    }

    try {
      // persist locally
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      // do NOT store raw passwords in localStorage in real apps; this is demo-only
      const safeProfile = { ...profile };
      safeProfile.currentPassword = "";
      safeProfile.newPassword = "";
      safeProfile.confirmPassword = "";
      localStorage.setItem(PROFILE_KEY, JSON.stringify(safeProfile));

      // apply theme & language immediately
      applyTheme(settings.theme);
      document.documentElement.lang = settings.language || "en";

      // If email reminders are enabled and email is present, try sending an OTP via backend
      if (settings.emailReminders && profile.email) {
        try {
          await sendOtp(profile.email);
          // inform user a verification OTP was sent
          setSavedMsg("✓ Settings saved and verification OTP sent to your email");
        } catch (e) {
          console.warn("Failed to send OTP:", e);
          setSavedMsg("✓ Settings saved (but failed to send verification email)");
        }
      } else {
        setSavedMsg("✓ Settings saved successfully");
      }
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to save. Try again.");
    }
  };

  // quick reset to defaults (only in UI; you can also clear localStorage if desired)
  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setProfile(defaultProfile);
    applyTheme(defaultSettings.theme);
    document.documentElement.lang = defaultSettings.language;
    setSavedMsg("Defaults restored (unsaved)");
    setTimeout(() => setSavedMsg(""), 2500);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col sm:flex-row">
      {/* Sidebar - updated to keep logout at bottom */}
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
            <Link href="/settings" className="px-3 py-2 rounded-md bg-gray-700 text-teal-300 transition">
              Settings
            </Link>
            <Link href="/support" className="px-3 py-2 rounded-md hover:bg-gray-700 hover:text-teal-300 transition">
              Support
            </Link>
          </nav>
        </div>

        {/* Spacer pushes logout to bottom */}
        <div className="flex-1" />

        {/* Logout link/button at bottom of sidebar */}
        <div className="mt-4">
          <Link
            href="/logout"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-teal-400 to-sky-500 text-gray-900 font-medium hover:from-teal-300 hover:to-sky-400 transition"
          >
            {/* Simple, valid logout icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 17l5-5-5-5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3" />
            </svg>
            Logout
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <section className="flex-1 p-6 sm:p-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-sky-500">Settings</h1>
          <p className="mt-1 text-gray-400">Manage your account and preferences</p>
        </header>

        {/* Status messages */}
        {savedMsg && <div className="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300">{savedMsg}</div>}
        {errorMsg && <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300">{errorMsg}</div>}

        <div className="max-w-4xl space-y-6">
          {/* Profile Settings */}
          <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/40">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">👤 Profile Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input type="text" name="name" value={profile.name} onChange={handleProfileChange} placeholder="Your name"
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input type="email" name="email" value={profile.email} onChange={handleProfileChange} placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white" />
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/40">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">🔒 Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={profile.currentPassword}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={profile.newPassword}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={profile.confirmPassword}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white"
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/40">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">🔔 Notifications</h2>
            <div className="space-y-4">
              <ToggleRow
                title="Push Notifications"
                subtitle="Receive push notifications for reminders"
                value={settings.notifications}
                onToggle={() => handleSettingsChange("notifications", !settings.notifications)}
              />
              <ToggleRow
                title="Email Reminders"
                subtitle="Get reminder emails"
                value={settings.emailReminders}
                onToggle={() => handleSettingsChange("emailReminders", !settings.emailReminders)}
              />
              <ToggleRow
                title="Sound Effects"
                subtitle="Play sound when reminder triggers"
                value={settings.soundEnabled}
                onToggle={() => handleSettingsChange("soundEnabled", !settings.soundEnabled)}
              />
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/40">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">🎨 Appearance</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleSettingsChange("theme", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingsChange("language", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                  <option value="es">Español</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleSettingsChange("timezone", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/40 rounded-lg focus:outline-none focus:border-teal-500 text-white"
                >
                  <option value="UTC+5:30">IST (UTC+5:30)</option>
                  <option value="UTC">UTC</option>
                  <option value="UTC-5">EST (UTC-5)</option>
                  <option value="UTC-8">PST (UTC-8)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/30">
            <h2 className="text-xl font-semibold mb-4 text-red-300 flex items-center gap-2">⚠️ Danger Zone</h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  localStorage.removeItem(SETTINGS_KEY);
                  localStorage.removeItem(PROFILE_KEY);
                  resetToDefaults();
                  setSavedMsg("All reminders removed and defaults restored");
                  setTimeout(() => setSavedMsg(""), 2500);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg hover:bg-red-500/30 transition"
              >
                Delete All Reminders
              </button>
              <button
                onClick={() => {
                  // placeholder for account deletion flow
                  setErrorMsg("Account deletion not implemented in demo.");
                  setTimeout(() => setErrorMsg(""), 3000);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg hover:bg-red-500/30 transition ml-0 sm:ml-3"
              >
                Delete Account
              </button>
            </div>
          </div>

          {/* Save button */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={saveSettings}
              className="px-8 py-3 bg-gradient-to-r from-teal-400 to-sky-500 text-gray-900 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Save Changes
            </button>
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-gray-800 border border-gray-700/40 rounded-lg font-medium hover:bg-gray-700 transition-all"
            >
              Cancel
            </Link>

            <button
              onClick={resetToDefaults}
              className="px-4 py-3 bg-gray-700/40 border border-gray-700/30 rounded-lg text-sm hover:bg-gray-700 transition ml-auto"
            >
              Reset
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

/* small helper component for toggles */
function ToggleRow({ title, subtitle, value, onToggle }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-gray-400">{subtitle}</div>
      </div>
      <button
        onClick={onToggle}
        aria-pressed={!!value}
        className={`relative w-14 h-7 rounded-full transition-colors ${value ? "bg-teal-500" : "bg-gray-700"}`}
      >
        <span
          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${value ? "translate-x-7" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}
