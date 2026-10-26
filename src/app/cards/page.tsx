import { StampRow } from "@/components/stamp-row";
import { listCards } from "@/server/loyalty";
import { requireUser } from "@/server/session";

export default async function CardsPage() {
  const user = await requireUser("/cards");
  const cards = listCards(user.id);

  return (
    <main className="page">
      <h1 className="title">My cards</h1>
      {cards.length === 0 ? (
        <p className="text-stone-600">No cards yet. Scan the QR code at a shop&apos;s counter to get your first stamp.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {cards.map((card) => (
            <li key={card.id} className="card">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold">{card.businessName}</h2>
                <span className="text-sm text-stone-500">
                  {card.stamps}/{card.stampsRequired}
                </span>
              </div>
              <StampRow stamps={card.stamps} total={card.stampsRequired} />
              <p className="mt-3 text-sm text-stone-600">Reward: {card.reward}</p>
              {card.pendingRewards > 0 && (
                <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 font-medium text-amber-900">
                  {card.pendingRewards === 1 ? "1 reward" : `${card.pendingRewards} rewards`} ready. Show this
                  screen at the counter.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
