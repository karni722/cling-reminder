"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginByOtp() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  function showMessage(type, text, autoClear = true) {
    setMsg({ type, text });
    if (autoClear) {
      setTimeout(() => setMsg(null), 6000);
    }
  }

  // ========== NEW: Generate avatar URL from email ==========
  async function generateAvatarURL(email) {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Simple hash function (MD5 alternative using Web Crypto API)
    const encoder = new TextEncoder();
    const data = encoder.encode(trimmedEmail);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Use first 32 chars (MD5 length equivalent)
    const hash = hashHex.substring(0, 32);
    
    // Gravatar URL with fallback to identicon
    return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
  }

  // ========== MODIFIED: Request OTP + Save Avatar ==========
  async function requestOtp(e) {
    e.preventDefault();
    setMsg(null);

    if (!isValidEmail(email)) {
      showMessage("error", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (res.ok) {
        showMessage("success", "OTP sent — check your inbox (and spam).");
        
        // ========== NEW: Generate and save avatar URL ==========
        const avatarURL = await generateAvatarURL(email);
        sessionStorage.setItem('userEmail', email.trim().toLowerCase());
        sessionStorage.setItem('userAvatar', avatarURL);
        
        setStep(2);
        setResendTimer(60);
      } else {
        showMessage("error", data?.message || "Could not send OTP. Try again later.");
      }
    } catch (err) {
      showMessage("error", "Network error — check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setMsg(null);

    if (!otp || otp.trim().length < 6) {
      showMessage("error", "Enter the 6-digit OTP you received in email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        showMessage("success", "Logged in — redirecting...");
        setTimeout(() => router.push("/dashboard"), 700);
      } else {
        showMessage("error", data?.message || "Invalid or expired OTP.");
      }
    } catch (err) {
      showMessage("error", "Network error — check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("success", "OTP resent. Check your inbox.");
        setResendTimer(60);
      } else {
        showMessage("error", data?.message || "Could not resend OTP.");
      }
    } catch (err) {
      showMessage("error", "Network error — check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const IconSpinner = () => (
    <svg
      className="animate-spin h-4 w-4 text-white inline-block -mt-0.5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/80 backdrop-blur-lg border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-teal-400 to-sky-500 text-gray-900 rounded-xl p-2 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M2 5a2 2 0 012-2h8a2 2 0 012 2v1h2a1 1 0 011 1v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a1 1 0 011-1h-1z" />
                  <path d="M7 9h6v2H7V9z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Sign in to Cling Reminder</h1>
                <p className="text-sm text-gray-400">Fast, passwordless sign in — secure & simple.</p>
              </div>
            </div>

            {msg && (
              <div
                className={`mt-6 p-3 rounded-md text-sm ${
                  msg.type === "error"
                    ? "bg-rose-900/40 text-rose-300 border border-rose-800"
                    : "bg-emerald-900/40 text-emerald-300 border border-emerald-800"
                }`}
                role="status"
                aria-live="polite"
              >
                {msg.text}
              </div>
            )}

            <div className="mt-6">
              {step === 1 && (
                <form onSubmit={requestOtp} className="space-y-4">
                  <label className="block text-sm font-medium text-gray-300">Email address</label>
                  <input
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
                    aria-label="Email address"
                  />

                  <button
                    type="submit"
                    disabled={loading || !isValidEmail(email)}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-gray-900 font-semibold transition active:scale-95 ${
                      loading || !isValidEmail(email)
                        ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-teal-400 to-sky-500 hover:from-teal-300 hover:to-sky-400 shadow-md hover:shadow-lg"
                    }`}
                    aria-disabled={loading || !isValidEmail(email)}
                  >
                    {loading ? (
                      <>
                        <IconSpinner /> Sending...
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </button>

                  <p className="text-xs text-gray-500">
                    We will email you a one-time 6-digit code. It expires in <strong>10 minutes</strong>.
                  </p>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={verifyOtp} className="space-y-4">
                  <div className="text-sm text-gray-400">
                    Enter the 6-digit code we sent to <span className="font-medium text-white">{email}</span>
                  </div>

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    required
                    className="w-full text-center tracking-widest text-lg font-medium px-4 py-3 rounded-lg border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
                    aria-label="One time password"
                  />

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="submit"
                      disabled={loading || otp.length < 6}
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-gray-900 font-semibold transition active:scale-95 ${
                        loading || otp.length < 6
                          ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-teal-400 to-sky-500 hover:from-teal-300 hover:to-sky-400 shadow-md hover:shadow-lg"
                      }`}
                      aria-disabled={loading || otp.length < 6}
                    >
                      {loading ? (
                        <>
                          <IconSpinner /> Verifying...
                        </>
                      ) : (
                        "Verify & Sign in"
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setOtp("");
                        setMsg(null);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-600 text-sm text-gray-300 hover:bg-gray-700/50 transition"
                    >
                      Change email
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div>Didn't receive it?</div>
                    <div>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendTimer > 0 || loading}
                        className={`text-sm font-medium ${resendTimer > 0 || loading ? "text-gray-600" : "text-teal-400 hover:underline"}`}
                        aria-disabled={resendTimer > 0 || loading}
                      >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-700 text-xs text-gray-500">
            By continuing you agree to our <span className="text-teal-400 hover:text-sky-400">Terms</span> &{" "}
            <span className="text-teal-400 hover:text-sky-400">Privacy</span>.
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-400 space-x-4">
          <Link href="/" className="underline text-gray-500 hover:text-gray-300 transition">
            &larr; Back to Home
          </Link>

          <button
            type="button"
            onClick={() => {
              setEmail("");
              setOtp("");
              setStep(1);
              setMsg(null);
            }}
            className="underline text-gray-500 hover:text-gray-300 transition"
          >
            Start over / Reset
          </button>
        </div>
      </div>
    </div>
  );
}