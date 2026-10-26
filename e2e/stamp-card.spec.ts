import { expect, test, type Page } from "@playwright/test";

async function signUp(page: Page, name: string) {
  await page.getByRole("button", { name: "New here? Create an account" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(`${name.toLowerCase()}-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
}

async function qrUrl(page: Page, notThis?: string) {
  const qr = page.getByTestId("qr");
  if (notThis) await expect(qr).not.toHaveAttribute("data-url", notThis);
  return (await qr.getAttribute("data-url"))!;
}

test("a customer fills a card and the owner redeems the reward", async ({ page: owner, browser }) => {
  // Owner sets up a two-stamp card
  await owner.goto("/business");
  await signUp(owner, "Olivia");
  await owner.getByLabel("Business name").fill("Bean There");
  await owner.getByLabel("Reward", { exact: true }).fill("A free coffee");
  await owner.getByLabel("Stamps for a reward").fill("2");
  await owner.getByRole("button", { name: "Create stamp card" }).click();
  await expect(owner.getByRole("heading", { name: "Bean There" })).toBeVisible();
  const first = await qrUrl(owner);

  // Customer scans, signs up and comes back to collect
  const customer = await (await browser.newContext()).newPage();
  await customer.goto(first);
  await expect(customer.getByText("Sign in or create an account to collect your stamp.")).toBeVisible();
  await signUp(customer, "Carlos");
  await customer.getByRole("button", { name: "Collect my stamp" }).click();
  await expect(customer.getByText("Stamp added!")).toBeVisible();

  // The used code no longer works, and the counter shows a new one
  await customer.goto(first);
  await expect(customer.getByText("This QR code was already used")).toBeVisible();
  const second = await qrUrl(owner, first);

  await customer.goto(second);
  await customer.getByRole("button", { name: "Collect my stamp" }).click();
  await expect(customer.getByText("Card complete! Your reward is ready.")).toBeVisible();
  await customer.getByRole("link", { name: "See my cards" }).click();
  await expect(customer.getByText("1 reward ready")).toBeVisible();

  // Owner hands over the reward
  await owner.reload();
  await expect(owner.getByText("Carlos")).toBeVisible();
  await owner.getByRole("button", { name: "Redeem reward" }).click();
  await expect(owner.getByRole("button", { name: "Redeem reward" })).toHaveCount(0);

  await customer.reload();
  await expect(customer.getByText("reward ready")).toHaveCount(0);
});
