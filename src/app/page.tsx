import Link from "next/link";

export default function Home() {
  return (
    <main className="page">
      <h1 className="mb-3 text-3xl font-bold">Stamp cards without the paper</h1>
      <p className="mb-8 text-lg text-stone-600">
        The shop shows a QR code at the counter. You scan it with your phone camera and get a stamp. Fill the card,
        get the reward.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/cards" className="card hover:border-amber-500">
          <h2 className="font-semibold">I&apos;m a customer</h2>
          <p className="text-sm text-stone-600">See your cards and rewards.</p>
        </Link>
        <Link href="/business" className="card hover:border-amber-500">
          <h2 className="font-semibold">I run a business</h2>
          <p className="text-sm text-stone-600">Create your stamp card and show the QR code.</p>
        </Link>
      </div>
    </main>
  );
}
