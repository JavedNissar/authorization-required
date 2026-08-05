#!/usr/bin/env node
// Build the batch-TTS manifest. Audio files are optional: add a `file` field to
// any entry after rendering and the runtime will use it automatically.
import { readFileSync, writeFileSync } from 'node:fs';
import { buildScript, callbackScript } from '../js/data/lines.js';

const lines = [];
const seen = new Set();
const add = (fragment, speaker, emotion = 'neutral') => {
  if (seen.has(fragment.id)) return;
  seen.add(fragment.id);
  lines.push({ id: fragment.id, text: fragment.text, speaker, emotion });
};

// Shared source clips are included for renderers that choose to reassemble card
// numbers more finely than the shipped per-call PAN fragment.
for (let n = 0; n <= 9; n++) add({ id: `digit.${n}`, text: String(n) }, 'shared', 'neutral');

for (let day = 1; day <= 14; day++) {
  const path = `content/days/day${String(day).padStart(2, '0')}.json`;
  const data = JSON.parse(readFileSync(path, 'utf8'));
  for (const call of data.calls) {
    const emotion = call.voice === 'wrong' ? 'too-calm' : call.voice === 'off' ? 'familiar-wrong' : 'businesslike';
    for (const fragment of buildScript(call)) add(fragment, call.merchant, emotion);
    for (const fragment of callbackScript(call)) add(fragment, `${call.merchant}.callback`, call.truth?.ghost ? 'operator' : 'guarded');
  }
}

writeFileSync('content/audio/lines.json', JSON.stringify({ version: 1, lines }, null, 2) + '\n');
console.log(`wrote content/audio/lines.json (${lines.length} lines)`);
