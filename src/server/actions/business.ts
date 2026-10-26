"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createBusiness, getBusinessByOwner, redeemReward } from "../loyalty";
import { requireBusiness, requireUser } from "../session";

export async function createBusinessAction(_prev: string | null, form: FormData): Promise<string | null> {
  const user = await requireUser("/business");
  if (getBusinessByOwner(user.id)) redirect("/business");
  try {
    createBusiness(user.id, {
      name: String(form.get("name") ?? ""),
      reward: String(form.get("reward") ?? ""),
      stampsRequired: Number(form.get("stampsRequired")),
    });
  } catch (error) {
    return error instanceof Error ? error.message : "Could not create the business";
  }
  redirect("/business");
}

export async function redeemRewardAction(form: FormData) {
  const { business } = await requireBusiness();
  redeemReward(business.id, String(form.get("rewardId")));
  revalidatePath("/business");
}
