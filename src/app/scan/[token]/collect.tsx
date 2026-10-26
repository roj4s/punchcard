"use client";

import Link from "next/link";
import { useActionState } from "react";
import { StampRow } from "@/components/stamp-row";
import { collectStampAction } from "@/server/actions/stamps";
import type { CollectResult } from "@/server/loyalty";

const errors = {
  invalid: "This QR code isn't valid.",
  used: "This QR code was already used. Ask for a new one at the counter.",
  "own-business": "You can't stamp your own business's card.",
};

export function Collect({ token }: { token: string }) {
  const [result, action, pending] = useActionState<CollectResult | null>(() => collectStampAction(token), null);

  if (!result) {
    return (
      <form action={action}>
        <button className="btn w-full" disabled={pending}>
          Collect my stamp
        </button>
      </form>
    );
  }

  if (!result.ok) {
    return (
      <p role="alert" className="text-red-600">
        {errors[result.reason]}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg font-semibold">{result.rewardEarned ? "Card complete! Your reward is ready." : "Stamp added!"}</p>
      {!result.rewardEarned && <StampRow stamps={result.stamps} total={result.stampsRequired} />}
      <Link href="/cards" className="btn">
        See my cards
      </Link>
    </div>
  );
}
