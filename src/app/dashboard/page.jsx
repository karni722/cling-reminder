import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import Link from "next/link";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function Dashboard() {
  const token = cookies().get("token")?.value;
  if (!token) return <div>Not authenticated. <Link href="/login">Login</Link></div>;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    await connectDB();
    const user = await User.findById(payload.sub).lean();
    if (!user) return <div>No such user. <Link href="/login">Login</Link></div>;
    return <div>Welcome {user.email}</div>;
  } catch (err) {
    return <div>Invalid session. <Link href="/login">Login</Link></div>;
  }
}
