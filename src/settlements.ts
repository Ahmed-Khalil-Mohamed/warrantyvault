import { fail, type Entry } from "./contracts";
export function splitCents(amount: number, people: string[]) {
  if (
    !Number.isSafeInteger(amount) ||
    amount < 1 ||
    !people.length ||
    new Set(people).size !== people.length
  )
    fail("invalid_split");
  return people.map((name, i) => ({
    name,
    cents:
      Math.floor(amount / people.length) + (i < amount % people.length ? 1 : 0),
  }));
}
export function balances(rows: Entry[]) {
  const totals: Record<string, number> = Object.create(null);
  const add = (name: string, n: number) =>
    (totals[name] = (totals[name] ?? 0) + n);
  for (const { data: d } of rows) {
    if (d.kind === "settlement") {
      add(d.paidBy, d.amount);
      add(d.people[0], -d.amount);
    } else {
      add(d.paidBy, d.amount);
      for (const s of splitCents(d.amount, d.people)) add(s.name, -s.cents);
    }
  }
  return totals;
}
export function settlements(rows: Entry[]) {
  const b = balances(rows),
    debt = Object.entries(b)
      .filter(([, n]) => n < 0)
      .map(([name, n]) => ({ name, n: -n })),
    credit = Object.entries(b)
      .filter(([, n]) => n > 0)
      .map(([name, n]) => ({ name, n }));
  const result: { from: string; to: string; amount: number }[] = [];
  let i = 0,
    j = 0;
  while (i < debt.length && j < credit.length) {
    const amount = Math.min(debt[i].n, credit[j].n);
    result.push({ from: debt[i].name, to: credit[j].name, amount });
    debt[i].n -= amount;
    credit[j].n -= amount;
    if (!debt[i].n) i++;
    if (!credit[j].n) j++;
  }
  return result;
}
