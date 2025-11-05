import { NextResponse } from "next/server";

export async function logout(req) {
  try {
    const cookieName = "token";
    const res = NextResponse.json({ ok: true, message: "Logged out" }, {
      status: 200,
      headers: {
        "Set-Cookie": `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      },
    });
    return res;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json({ ok: false, message: "Logout failed" }, { status: 500 });
  }
}
