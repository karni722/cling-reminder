// app/page.jsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>Welcome to OTP Login App</h1>
      <p><Link href="/login">Go to Login</Link></p>
    </main>
  );
}
