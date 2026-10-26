import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { businesses, cards, qrTokens, rewards, user } from "@/db/schema";

export const MAX_STAMPS = 50;

export interface BusinessInput {
  name: string;
  reward: string;
  stampsRequired: number;
}

export function createBusiness(ownerId: string, input: BusinessInput) {
  const name = input.name.trim();
  const reward = input.reward.trim();
  const { stampsRequired } = input;
  if (!name || !reward) throw new Error("Name and reward are required");
  if (!Number.isInteger(stampsRequired) || stampsRequired < 1 || stampsRequired > MAX_STAMPS) {
    throw new Error(`Stamps required must be between 1 and ${MAX_STAMPS}`);
  }
  // owner_id is unique: a second business for the same owner fails here
  return db.insert(businesses).values({ ownerId, name, reward, stampsRequired }).returning().get();
}

export function getBusinessByOwner(ownerId: string) {
  return db.select().from(businesses).where(eq(businesses.ownerId, ownerId)).get() ?? null;
}

// The token the counter shows: the unused one, or a fresh one once it is used
export function currentToken(businessId: string) {
  const unused = db
    .select({ token: qrTokens.token })
    .from(qrTokens)
    .where(and(eq(qrTokens.businessId, businessId), isNull(qrTokens.usedAt)))
    .get();
  if (unused) return unused.token;

  const token = randomBytes(16).toString("base64url");
  db.insert(qrTokens).values({ token, businessId }).run();
  return token;
}

export function getToken(token: string) {
  return (
    db
      .select({ usedAt: qrTokens.usedAt, businessName: businesses.name, reward: businesses.reward })
      .from(qrTokens)
      .innerJoin(businesses, eq(businesses.id, qrTokens.businessId))
      .where(eq(qrTokens.token, token))
      .get() ?? null
  );
}

export type CollectResult =
  | { ok: true; businessName: string; stamps: number; stampsRequired: number; rewardEarned: boolean }
  | { ok: false; reason: "invalid" | "used" | "own-business" };

export function collectStamp(token: string, userId: string): CollectResult {
  return db.transaction((tx) => {
    const found = tx
      .select({ businessId: qrTokens.businessId, usedAt: qrTokens.usedAt, business: businesses })
      .from(qrTokens)
      .innerJoin(businesses, eq(businesses.id, qrTokens.businessId))
      .where(eq(qrTokens.token, token))
      .get();
    if (!found) return { ok: false, reason: "invalid" };
    if (found.usedAt) return { ok: false, reason: "used" };
    const { business } = found;
    if (business.ownerId === userId) return { ok: false, reason: "own-business" };

    // The `used_at IS NULL` condition makes the claim single-use even if two
    // processes race on the same token
    const claimed = tx
      .update(qrTokens)
      .set({ usedAt: new Date(), usedBy: userId })
      .where(and(eq(qrTokens.token, token), isNull(qrTokens.usedAt)))
      .returning()
      .get();
    if (!claimed) return { ok: false, reason: "used" };

    let card = tx
      .insert(cards)
      .values({ businessId: business.id, userId, stamps: 1 })
      .onConflictDoUpdate({
        target: [cards.businessId, cards.userId],
        set: { stamps: sql`${cards.stamps} + 1`, updatedAt: new Date() },
      })
      .returning()
      .get();

    const rewardEarned = card.stamps >= business.stampsRequired;
    if (rewardEarned) {
      tx.insert(rewards).values({ cardId: card.id }).run();
      card = tx.update(cards).set({ stamps: 0 }).where(eq(cards.id, card.id)).returning().get();
    }

    return {
      ok: true,
      businessName: business.name,
      stamps: card.stamps,
      stampsRequired: business.stampsRequired,
      rewardEarned,
    };
  });
}

function pendingRewardIdsByCard(cardIds: string[]) {
  const byCard = new Map<string, string[]>();
  if (cardIds.length === 0) return byCard;
  const pending = db
    .select({ id: rewards.id, cardId: rewards.cardId })
    .from(rewards)
    .where(and(inArray(rewards.cardId, cardIds), isNull(rewards.redeemedAt)))
    .orderBy(rewards.createdAt)
    .all();
  for (const r of pending) byCard.set(r.cardId, [...(byCard.get(r.cardId) ?? []), r.id]);
  return byCard;
}

// A customer's cards, most recently stamped first
export function listCards(userId: string) {
  const rows = db
    .select({
      id: cards.id,
      stamps: cards.stamps,
      businessName: businesses.name,
      reward: businesses.reward,
      stampsRequired: businesses.stampsRequired,
    })
    .from(cards)
    .innerJoin(businesses, eq(businesses.id, cards.businessId))
    .where(eq(cards.userId, userId))
    .orderBy(desc(cards.updatedAt))
    .all();
  const pending = pendingRewardIdsByCard(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, pendingRewards: pending.get(r.id)?.length ?? 0 }));
}

// A business's customers, most recently stamped first
export function listCustomers(businessId: string) {
  const rows = db
    .select({ cardId: cards.id, userId: cards.userId, name: user.name, stamps: cards.stamps })
    .from(cards)
    .innerJoin(user, eq(user.id, cards.userId))
    .where(eq(cards.businessId, businessId))
    .orderBy(desc(cards.updatedAt))
    .all();
  const pending = pendingRewardIdsByCard(rows.map((r) => r.cardId));
  return rows.map((r) => ({ ...r, pendingRewardIds: pending.get(r.cardId) ?? [] }));
}

export function redeemReward(businessId: string, rewardId: string) {
  const ownCard = db.select({ id: cards.id }).from(cards).where(eq(cards.businessId, businessId));
  const redeemed = db
    .update(rewards)
    .set({ redeemedAt: new Date() })
    .where(and(eq(rewards.id, rewardId), isNull(rewards.redeemedAt), inArray(rewards.cardId, ownCard)))
    .returning({ id: rewards.id })
    .all();
  return redeemed.length === 1;
}
