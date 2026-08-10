// Line fragments → stitched call script. Each fragment has an id for lines.json
// and a text template. The audio layer plays per-fragment; subtitles show text.

import { merchantName } from './merchants.js';

export function buildScript(call) {
  const m = displayMerchant(call);
  const brand = call.brand || 'CHARGEX';
  const amt = call.amount.toFixed(2);
  const [dollars, cents] = amt.split('.');
  const spokenPan = call.card.pan.replace(/\D/g, '').split('').join(' ');
  const name = call.card.name;
  const frags = [];
  frags.push({ id: `${call.id}.greet`, text: pickGreet(call) });
  frags.push({ id: `${call.id}.ident`, text: `${m} here. I have a ${brand} charge that needs authorization.` });
  frags.push({
    id: `${call.id}.pan`,
    text: `Card number ${spokenPan}. Expires ${call.card.exp}. Name on the card, ${name}.`,
    transcript: `Card number ${call.card.pan}. Expires ${call.card.exp}. Name on the card, ${name}.`,
  });
  frags.push({ id: `${call.id}.amt`, text: `Amount is ${dollars} dollars${cents === '00' ? '' : ` and ${cents} cents`}.` });

  if (call.truth?.preparation) {
    frags.push({ id: `${call.id}.detail`, text: 'The order is flour, sugar, lard, salt, and yeast. Enough for a month, perhaps longer.' });
  } else if (call.truth?.tomorrow) {
    frags.push({ id: `${call.id}.detail`, text: 'One other thing. The date stamped on this sales draft is tomorrow.' });
  } else if (call.truth?.categoryMismatch) {
    frags.push({ id: `${call.id}.detail`, text: `The imprint says ${call.truth.categoryLabel || 'general merchandise'}, but that is not what was sold.` });
  }

  frags.push({ id: `${call.id}.close`, text: pickClose(call) });
  return frags;
}

function pickGreet(call) {
  if (call.voice === 'wrong') return '…Yes. Hello. Is this the bank?';
  if (call.voice === 'off') return 'Hello. It is me again. You know my voice, surely.';
  const greetings = ['Good morning, bank?', 'Good afternoon, bank.', 'Hello, bank? Is that you?', 'Hello there, bank.'];
  return greetings[Math.abs(hash(call.id)) % greetings.length];
}

function pickClose(call) {
  if (call.truth?.address) return 'You are not the one who decides. You are the part that says it aloud.';
  if (call.voice === 'wrong') return 'You will approve that. Thank you.';
  const closers = ['Can you give me a code for that?', 'What do you say?', 'The customer is waiting.', 'Could you give us a number?'];
  return closers[Math.abs(hash(call.id) + 1) % closers.length];
}

function hash(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return h; }

export function callbackScript(call) {
  const m = displayMerchant(call);
  const out = [];
  if (call.truth?.stolen) {
    out.push({ id: `${call.id}.cb`, text: `You ring back. A different voice answers. “${m}? No, he is not here. He has been gone since the weekend. Who is this?”` });
  } else if (call.truth?.ghost) {
    out.push({ id: `${call.id}.cb`, text: 'You ring back. The number does not connect. The operator says there is no listing for that business. There never has been.' });
  } else if (call.truth?.split) {
    out.push({ id: `${call.id}.cb`, text: 'You ring back. “That was the same sale. Two drafts, yes, but one customer. Why?”' });
  } else if (call.truth?.address) {
    out.push({ id: `${call.id}.cb`, text: 'You ring back. Your receiver clicks before the first ring. The voice says, “Still there,” and disconnects.' });
  } else if (call.truth?.deadman) {
    out.push({ id: `${call.id}.cb`, text: 'You ring back. His wife answers. She is quiet a moment, then: “You must be mistaken. He has been buried a month. Who is using his card?”' });
  } else if (call.truth?.impersonating) {
    out.push({ id: `${call.id}.cb`, text: 'You ring back. The phone is picked up on the first ring, but no one speaks until you are about to hang up. Then, in the right voice this time, from somewhere with weather in it: “Not today.”' });
  } else if (call.truth?.ownpan) {
    out.push({ id: `${call.id}.cb`, text: 'You ring back. Your own telephone, on your own desk, begins to ring.' });
  } else if (call.truth?.tomorrow) {
    out.push({ id: `${call.id}.cb`, text: 'You ring back. “Dated tomorrow?” A pause. “The drafts came printed that way. From the bank. You would know.”' });
  } else if (call.voice === 'wrong') {
    out.push({ id: `${call.id}.cb`, text: 'You ring back. It rings a long time. When someone answers, no one speaks. You can hear the weather behind them.' });
  } else {
    out.push({ id: `${call.id}.cb`, text: `You ring back. ${m} confirms the charge, a little put out. “It is all regular. Run it through.”` });
  }
  return out;
}

function displayMerchant(call) { return call.merchantLabel || merchantName(call.merchant); }
