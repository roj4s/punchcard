"use server";

import { collectStamp, type CollectResult } from "../loyalty";
import { requireUser } from "../session";

export async function collectStampAction(token: string): Promise<CollectResult> {
  const user = await requireUser(`/scan/${encodeURIComponent(token)}`);
  return collectStamp(token, user.id);
}
