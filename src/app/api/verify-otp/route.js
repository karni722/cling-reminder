
import { verifyOtp } from "../../../../backend/controller/verifyOtpControllers";

export async function POST(req) {
  return await verifyOtp(req);
}
