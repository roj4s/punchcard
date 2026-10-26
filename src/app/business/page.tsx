import { redeemRewardAction } from "@/server/actions/business";
import { getBusinessByOwner, listCustomers } from "@/server/loyalty";
import { requireUser } from "@/server/session";
import { QrDisplay } from "./qr-display";
import { SetupForm } from "./setup-form";

export default async function BusinessPage() {
  const user = await requireUser("/business");
  const business = getBusinessByOwner(user.id);

  if (!business) {
    return (
      <main className="page max-w-sm">
        <h1 className="title">Set up your stamp card</h1>
        <SetupForm />
      </main>
    );
  }

  const customers = listCustomers(business.id);

  return (
    <main className="page">
      <h1 className="title">{business.name}</h1>
      <p className="mb-6 text-stone-600">
        {business.stampsRequired} stamps for {business.reward}. Each QR code gives one stamp, then a new one appears.
      </p>
      <section className="card mb-8 flex justify-center">
        <QrDisplay />
      </section>

      <h2 className="mb-3 text-lg font-semibold">Customers</h2>
      {customers.length === 0 ? (
        <p className="text-stone-600">No stamps yet.</p>
      ) : (
        <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {customers.map((c) => (
            <li key={c.cardId} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-stone-500">
                  {c.stamps}/{business.stampsRequired} stamps
                </p>
              </div>
              {c.pendingRewardIds.length > 0 && (
                <form action={redeemRewardAction}>
                  <input type="hidden" name="rewardId" value={c.pendingRewardIds[0]} />
                  <button className="btn btn-sm">
                    Redeem reward{c.pendingRewardIds.length > 1 && ` (${c.pendingRewardIds.length})`}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
