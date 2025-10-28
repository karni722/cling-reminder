"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * LoginByOtp - Tailwind styled OTP login component
 * Put this in: src/app/login/page.jsx  (or app/login/page.jsx)
 *
 * Requirements: Tailwind CSS configured in project.
 */

export default function LoginByOtp() {
  const [step, setStep] = useState(1); // 1: request email, 2: enter otp
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState(null); // { type: "error" | "success" | "info", text: string }
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0); // seconds left for resend
  const router = useRouter();

  // Countdown effect for resendTimer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  // Helper: simple email validation
  const isValidEmail = (e) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  };

  function showMessage(type, text, autoClear = true) {
    setMsg({ type, text });
    if (autoClear) {
      setTimeout(() => setMsg(null), 6000);
    }
  }

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
        setStep(2);
        setResendTimer(60); // 60s before resend allowed
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

    if (!otp || otp.trim().length < 4) {
      showMessage("error", "Enter the OTP you received in email.");
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
        // short delay so user sees the message
        setTimeout(() => router.push("/dashboard"), 900);
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

  // Small presentational components
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
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-sky-500 to-indigo-500 text-white rounded-xl p-2 shadow">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M2 5a2 2 0 012-2h8a2 2 0 012 2v1h2a1 1 0 011 1v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a1 1 0 011-1h-1z" />
                  <path d="M7 9h6v2H7V9z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">Sign in with Email OTP</h1>
                <p className="text-sm text-slate-500">Fast, passwordless sign in — secure & simple.</p>
              </div>
            </div>

            {/* messages */}
            {msg && (
              <div
                className={`mt-6 p-3 rounded-md text-sm ${
                  msg.type === "error" ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-emerald-50 text-emerald-800 border border-emerald-100"
                }`}
                role="status"
                aria-live="polite"
              >
                {msg.text}
              </div>
            )}

            {/* Form body */}
            <div className="mt-6">
              {step === 1 && (
                <form onSubmit={requestOtp} className="space-y-4">
                  <label className="block text-sm font-medium text-slate-700">Email address</label>
                  <input
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent transition"
                    aria-label="Email address"
                  />

                  <button
                    type="submit"
                    disabled={loading || !isValidEmail(email)}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-medium transition ${
                      loading || !isValidEmail(email)
                        ? "bg-slate-300 cursor-not-allowed"
                        : "bg-sky-600 hover:bg-sky-700 active:scale-95"
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

                  <p className="text-xs text-slate-400">
                    We will email you a one-time 6-digit code. It expires in <strong>10 minutes</strong>.
                  </p>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={verifyOtp} className="space-y-4">
                  <div className="text-sm text-slate-600">
                    Enter the 6-digit code we sent to <span className="font-medium text-slate-800">{email}</span>
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
                    className="w-full text-center tracking-widest text-lg font-medium px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 transition"
                    aria-label="One time password"
                  />

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="submit"
                      disabled={loading || otp.length < 4}
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-medium transition ${
                        loading || otp.length < 4 ? "bg-slate-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
                      }`}
                      aria-disabled={loading || otp.length < 4}
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
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Change email
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div>
                      Didn’t receive it?
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendTimer > 0 || loading}
                        className={`text-sm font-medium ${resendTimer > 0 || loading ? "text-slate-300" : "text-sky-600 hover:underline"}`}
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

          <div className="px-6 py-4 bg-gradient-to-t from-white/50 via-transparent to-transparent border-t border-gray-100 text-xs text-slate-400">
            By continuing you agree to our <span className="text-sky-600">Terms</span> & <span className="text-sky-600">Privacy</span>.
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          <button
            type="button"
            onClick={() => {
              // quick dev helper: clear cookie by visiting /api/logout if exists, or just clear UI
              setEmail("");
              setOtp("");
              setStep(1);
              setMsg(null);
            }}
            className="underline text-slate-400 hover:text-slate-600"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}
