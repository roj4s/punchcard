"use client";

import { useActionState } from "react";
import { createBusinessAction } from "@/server/actions/business";

export function SetupForm() {
  const [error, action, pending] = useActionState(createBusinessAction, null);

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="field">
        Business name
        <input name="name" required placeholder="Bean There Café" />
      </label>
      <label className="field">
        Reward
        <input name="reward" required placeholder="A free coffee" />
      </label>
      <label className="field">
        Stamps for a reward
        <input name="stampsRequired" type="number" min={1} max={50} defaultValue={10} required />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button className="btn" disabled={pending}>
        Create stamp card
      </button>
    </form>
  );
}
