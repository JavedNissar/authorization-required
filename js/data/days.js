// Load day JSON + assemble runtime ctx (bulletin, accounts, floors, rules).
import { rng, pick, int } from '../engine/rng.js';
import { SURNAMES, FIRSTS, MERCHANTS, FLOOR_LIMITS } from '../data/merchants.js';

const CITY = ''; // never named

export async function loadDay(n) {
  const r = await fetch(`content/days/day${String(n).padStart(2, '0')}.json`);
  if (!r.ok) throw new Error(`missing day ${n}`);
  return r.json();
}

export function makeCtx(dayData, seed) {
  const r = rng(seed * 13 + dayData.day);
  const accounts = new Map();
  for (const c of dayData.calls) {
    if (c.truth?.ghost || c.truth?.noAccount) continue;
    if (!accounts.has(c.card.pan)) {
      accounts.set(c.card.pan, makeAccount(r, c.card, c.truth, c.amount, dayData.date));
    }
  }
  // filler accounts for the index frame
  for (let i = 0; i < 22; i++) {
    const pan = makePan(r);
    if (!accounts.has(pan)) accounts.set(pan, makeAccount(r, null, {}, 0, dayData.date));
  }
  const bulletin = new Set();
  for (const c of dayData.calls) {
    if (c.truth?.bulletinHit) bulletin.add(c.card.pan);
  }
  for (let i = 0; i < 30; i++) bulletin.add(makePan(r));
  // stale bulletin: numbers cancelled after printing don't appear — those
  // calls carry truth.staleStolen and must be caught via account file instead.
  const floors = new Map(Object.entries(MERCHANTS).map(([id, merchant]) => [id, FLOOR_LIMITS[merchant.cat]]));
  return {
    accounts, bulletin, floors,
    date: dayData.date,
    memos: dayData.memos || [],
  };
}

function makePan(r) {
  const g = () => String(int(r, 0, 9999)).padStart(4, '0');
  return `4${String(int(r, 0, 999)).padStart(3, '0').slice(0, 3)}-${g()}-${g()}`;
}

function makeAccount(r, card, truth = {}, amount = 0, date = '1971-01-01') {
  const name = card?.name ?? `${pick(r, FIRSTS)} ${pick(r, SURNAMES)}`.toUpperCase();
  const status = truth.staleStolen || truth.accountOK === false ? 'closed' : 'open';
  const limits = [300, 500, 750, 1000].filter(v => v >= amount + 75);
  const limit = limits.length ? pick(r, limits) : Math.ceil((amount + 100) / 250) * 250;
  const balance = truth.acctOver
    ? Math.round((limit - amount + 10 + r() * Math.min(40, amount / 2)) * 100) / 100
    : Math.round(r() * Math.max(0, Math.min(limit * 0.62, limit - amount - 10)) * 100) / 100;
  const issueMax = Math.max(68, Math.min(79, Number(date.slice(2, 4))));
  return {
    pan: card?.pan ?? makePan(r),
    name, city: card?.city ?? CITY,
    limit,
    balance: Math.max(0, balance),
    status,
    issued: `${int(r, 68, issueMax)}-${String(int(r, 1, 12)).padStart(2, '0')}`,
    note: status === 'closed' ? 'ACCOUNT CLOSED — SEE BULLETIN SUPPLEMENT' : '',
  };
}

export { makePan };
