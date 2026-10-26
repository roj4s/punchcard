import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { user } from "@/db/schema";
import {
  collectStamp,
  createBusiness,
  currentToken,
  listCards,
  listCustomers,
  redeemReward,
} from "./loyalty";

let n = 0;
function createUser(name = "User") {
  const id = `user-${++n}`;
  db.insert(user).values({ id, name, email: `${id}@example.com` }).run();
  return id;
}

let ownerId: string;
let businessId: string;

beforeEach(() => {
  ownerId = createUser("Owner");
  businessId = createBusiness(ownerId, { name: "Bean There", reward: "Free coffee", stampsRequired: 3 }).id;
});

describe("createBusiness", () => {
  it("rejects invalid input", () => {
    const other = createUser();
    expect(() => createBusiness(other, { name: " ", reward: "x", stampsRequired: 3 })).toThrow();
    expect(() => createBusiness(other, { name: "A", reward: "x", stampsRequired: 0 })).toThrow();
    expect(() => createBusiness(other, { name: "A", reward: "x", stampsRequired: 51 })).toThrow();
  });

  it("allows one business per owner", () => {
    expect(() => createBusiness(ownerId, { name: "Again", reward: "x", stampsRequired: 5 })).toThrow();
  });
});

describe("currentToken", () => {
  it("returns the same token until it is used", () => {
    const token = currentToken(businessId);
    expect(currentToken(businessId)).toBe(token);

    collectStamp(token, createUser());
    expect(currentToken(businessId)).not.toBe(token);
  });
});

describe("collectStamp", () => {
  it("gives a stamp and creates the card", () => {
    const customer = createUser();
    const result = collectStamp(currentToken(businessId), customer);

    expect(result).toEqual({ ok: true, businessName: "Bean There", stamps: 1, stampsRequired: 3, rewardEarned: false });
    expect(listCards(customer)).toMatchObject([{ businessName: "Bean There", stamps: 1, pendingRewards: 0 }]);
  });

  it("gives one stamp per token", () => {
    const token = currentToken(businessId);
    expect(collectStamp(token, createUser()).ok).toBe(true);
    expect(collectStamp(token, createUser())).toEqual({ ok: false, reason: "used" });
  });

  it("rejects unknown tokens", () => {
    expect(collectStamp("nope", createUser())).toEqual({ ok: false, reason: "invalid" });
  });

  it("does not let the owner stamp their own card, and keeps the token usable", () => {
    const token = currentToken(businessId);
    expect(collectStamp(token, ownerId)).toEqual({ ok: false, reason: "own-business" });
    expect(collectStamp(token, createUser()).ok).toBe(true);
  });

  it("turns a full card into a reward and starts a new card", () => {
    const customer = createUser();
    collectStamp(currentToken(businessId), customer);
    collectStamp(currentToken(businessId), customer);
    const third = collectStamp(currentToken(businessId), customer);

    expect(third).toMatchObject({ ok: true, stamps: 0, rewardEarned: true });
    expect(listCards(customer)).toMatchObject([{ stamps: 0, pendingRewards: 1 }]);
  });
});

describe("redeemReward", () => {
  function earnReward(customer: string) {
    for (let i = 0; i < 3; i++) collectStamp(currentToken(businessId), customer);
    return listCustomers(businessId).find((c) => c.userId === customer)!.pendingRewardIds[0];
  }

  it("marks a reward redeemed once", () => {
    const customer = createUser("Ana");
    const rewardId = earnReward(customer);

    expect(redeemReward(businessId, rewardId)).toBe(true);
    expect(redeemReward(businessId, rewardId)).toBe(false);
    expect(listCards(customer)[0].pendingRewards).toBe(0);
  });

  it("only redeems rewards of the given business", () => {
    const rewardId = earnReward(createUser());
    const otherBusiness = createBusiness(createUser(), { name: "Other", reward: "x", stampsRequired: 2 });

    expect(redeemReward(otherBusiness.id, rewardId)).toBe(false);
    expect(redeemReward(businessId, rewardId)).toBe(true);
  });
});
