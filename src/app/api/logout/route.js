// src/app/api/logout/route.js
import { logout } from "../../../../backend/controller/logoutControllers";

export async function POST(req) {
  return await logout(req);
}
