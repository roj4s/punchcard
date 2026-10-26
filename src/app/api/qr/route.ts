import QRCode from "qrcode";
import { getBusinessByOwner, currentToken } from "@/server/loyalty";
import { getUser } from "@/server/session";

// The counter display polls this; the token changes as soon as it is used
export async function GET(request: Request) {
  const user = await getUser();
  const business = user && getBusinessByOwner(user.id);
  if (!business) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const token = currentToken(business.id);
  const url = new URL(`/scan/${token}`, process.env.BETTER_AUTH_URL ?? request.url).toString();
  const svg = await QRCode.toString(url, { type: "svg", margin: 1 });
  return Response.json({ token, url, svg }, { headers: { "Cache-Control": "no-store" } });
}
