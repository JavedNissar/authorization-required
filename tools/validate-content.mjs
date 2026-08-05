#!/usr/bin/env node
// Campaign integrity checks. Exits non-zero on broken rules, chronology, links,
// terminal coverage, missing lines, or accidental place/lore leakage.
import { readFileSync } from 'node:fs';
import { makeCtx } from '../js/data/days.js';
import { Day } from '../js/engine/day.js';
import { evaluate } from '../js/engine/rules.js';
import { MERCHANTS } from '../js/data/merchants.js';
import { buildScript, callbackScript } from '../js/data/lines.js';

const failures = [];
const fail = message => failures.push(message);
const days = [];
const lineManifest = JSON.parse(readFileSync('content/audio/lines.json', 'utf8'));
const lineIds = new Set(lineManifest.lines.map(line => line.id));
const authoredAnomalies = new Set(['d5beat1', 'd8beat1', 'd10beat1', 'd11beat1', 'd12beat2', 'd13beat2']);
const forbidden = /newfoundland|nova scotia|new brunswick|prince edward|carbonear|wendigo|mi.?kmaq|first nations/i;

for (let n = 1; n <= 14; n++) {
  const label = `day${String(n).padStart(2, '0')}`;
  const data = JSON.parse(readFileSync(`content/days/${label}.json`, 'utf8'));
  days.push(data);
  if (data.day !== n) fail(`${label}: data.day is ${data.day}`);
  if (data.calls.length !== data.quota) fail(`${label}: ${data.calls.length} calls but quota ${data.quota}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) fail(`${label}: invalid date ${data.date}`);
  if (forbidden.test(JSON.stringify(data))) fail(`${label}: forbidden real-place or excluded lore reference`);
  const expectedPages = n <= 11 ? 4 : n === 14 ? 2 : 3;
  if (data.paper.length !== expectedPages) fail(`${label}: expected ${expectedPages} paper pages, got ${data.paper.length}`);

  const ids = new Set();
  const ctx = makeCtx(data, 1971);
  const schedule = new Day(data, 1971);
  let scheduled = 0;
  while (!schedule.over) {
    const call = schedule.tick(0.25, true);
    if (call) {
      scheduled += 1;
      schedule.spend((n >= 6 ? 2 : 5) + 10); // ordinary lookup/deliberation budget
      schedule.armNext();
    }
  }
  if (scheduled < data.quota) fail(`${label}: quota cannot be met at normal deliberation pace`);
  for (const call of data.calls) {
    if (ids.has(call.id)) fail(`${label}: duplicate call id ${call.id}`);
    ids.add(call.id);
    if (!MERCHANTS[call.merchant] && !call.merchantLabel) fail(`${label}/${call.id}: unknown merchant without display label`);
    if (!/^4\d{3}-\d{4}-\d{4}$/.test(call.card.pan)) fail(`${label}/${call.id}: malformed PAN`);
    if (!/^\d{2}\/\d{2}$/.test(call.card.exp)) fail(`${label}/${call.id}: malformed expiry`);
    if (!['approve', 'decline'].includes(call.correct)) fail(`${label}/${call.id}: bad canonical verdict`);
    if (n >= 6 && !['approve', 'decline', 'refer'].includes(call.terminalVerdict)) fail(`${label}/${call.id}: missing terminal verdict`);
    if (n < 6 && call.terminalVerdict) fail(`${label}/${call.id}: terminal verdict before automation`);
    if ((n >= 12 ? 'VISA' : 'CHARGEX') !== (call.brand || 'CHARGEX')) fail(`${label}/${call.id}: wrong card brand`);

    const engine = evaluate(data.rules, call, ctx);
    if (engine.verdict !== call.correct && !authoredAnomalies.has(call.id)) {
      fail(`${label}/${call.id}: engine says ${engine.verdict} (${engine.reason}), content says ${call.correct}`);
    }
    if (call.truth?.acctOver) {
      const account = ctx.accounts.get(call.card.pan);
      if (!account || account.balance + call.amount <= account.limit) fail(`${label}/${call.id}: acctOver is not over limit`);
    }
    if (call.truth?.ghost && ctx.accounts.has(call.card.pan)) fail(`${label}/${call.id}: ghost business has an account`);
    if (call.truth?.bulletinHit && !ctx.bulletin.has(call.card.pan)) fail(`${label}/${call.id}: bulletin hit absent from bulletin`);

    for (const fragment of [...buildScript(call), ...callbackScript(call)]) {
      if (!lineIds.has(fragment.id)) fail(`${label}/${call.id}: missing audio manifest line ${fragment.id}`);
    }
  }

  const paperText = JSON.stringify(data.paper);
  if (/\bbank\b|authorization desk|clerk at/i.test(paperText)) {
    fail(`${label}: newspaper directly mentions the desk/player/bank`);
  }
}

for (let i = 1; i < days.length; i++) {
  if (days[i].date <= days[i - 1].date) fail(`chronology: day ${i + 1} is not later than day ${i}`);
}
if (!days.at(-1).date.startsWith('1979')) fail('campaign does not end in 1979');

const splitA = days[3].calls.find(c => c.id === 'd4beat1');
const splitB = days[3].calls.find(c => c.id === 'd4beat2');
if (!splitA || !splitB || splitA.card.pan !== splitB.card.pan) fail('split-draft calls do not share a card');

if (failures.length) {
  console.error(`CONTENT VALIDATION FAILED (${failures.length})`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`content valid: 14 days, ${days.reduce((n, d) => n + d.calls.length, 0)} calls, ${lineManifest.lines.length} audio lines`);
