import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBusinessByOwner } from "./loyalty";

export const getUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});

// `next` is where to come back to after signing in
export async function requireUser(next?: string) {
  const user = await getUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}

// The signed-in owner and their business; business data is always looked up
// from the session, never from an id the client sends
export async function requireBusiness() {
  const user = await requireUser("/business");
  const business = getBusinessByOwner(user.id);
  if (!business) redirect("/business");
  return { user, business };
}
