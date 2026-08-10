#!/usr/bin/env node
// Headless browser smoke test for the static build. Requires playwright-core
// only in the local development environment; it is not a game dependency.
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(`PAGEERROR: ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`CONSOLE: ${m.text()}`); });
page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`); });

await page.goto('http://localhost:8642/index.html?seed=1971&speed=12');
await page.click('#btn-begin');
await page.waitForFunction(() => document.getElementById('phone-state').textContent === 'LINE RINGING', null, { timeout: 20000 });
console.log('✓ first call rings');
await page.click('#btn-pickup');
await page.waitForFunction(() => !document.getElementById('btn-approve').disabled, null, { timeout: 30000 });
console.log('✓ call plays; deliberation opens:', await page.textContent('#call-meta'));

await page.click('#btn-approve');
const issued = (await page.textContent('#issued-code')).trim();
await page.getByRole('button', { name: new RegExp(issued[0]) }).filter({ hasText: issued }).click();
await page.waitForFunction(() => document.getElementById('logline').textContent.startsWith('Approved.'));
const result = await page.textContent('#logline');
if (!result.startsWith('Approved.')) errors.push(`unexpected first-call result: ${result}`);
console.log('✓ deterministic code readback:', issued);

// Semantic shortcut 6 opens page one of the paper.
await page.click('#fiche');
await page.keyboard.press('6');
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/charge-jam-day1.png' });
console.log('✓ fiche keyboard navigation');

// Direct debug day verifies the terminal era initializes and renders.
const act2 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
act2.on('pageerror', e => errors.push(`ACT2 PAGEERROR: ${e.message}`));
await act2.goto('http://localhost:8642/index.html?seed=1971&day=6&speed=20');
await act2.click('#btn-begin');
await act2.waitForFunction(() => document.getElementById('phone-state').textContent === 'LINE RINGING', null, { timeout: 20000 });
await act2.click('#btn-pickup');
await act2.waitForFunction(() => /APPROVED|DECLINE|REFER/.test(document.getElementById('term-text').textContent), null, { timeout: 30000 });
console.log('✓ Act II terminal verdict:', (await act2.textContent('#term-text')).trim().split('\n').at(-1));
await act2.screenshot({ path: '/tmp/charge-jam-act2.png' });

// Final-day visual frame: the fixed film treatment must remain readable.
const final = await browser.newPage({ viewport: { width: 1280, height: 800 } });
final.on('pageerror', e => errors.push(`FINAL PAGEERROR: ${e.message}`));
await final.goto('http://localhost:8642/index.html?seed=1971&day=14');
await final.click('#btn-begin');
await final.click('#fiche');
await final.keyboard.press('1');
await final.waitForTimeout(600);
await final.screenshot({ path: '/tmp/charge-jam-day14.png' });
console.log('✓ final-day fixed film treatment rendered');

console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'NO ERRORS');
await browser.close();
process.exit(errors.length ? 1 : 0);
