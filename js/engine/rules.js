// Rule engine: a rule is a data-driven predicate over (call, ctx).
// ctx = { bulletin:Set<pan>, accounts:Map<pan,acct>, floors:Map<merchant,floor>, memos:[...], date }
// Each rule returns {verdict:'decline'|'approve'|'flag', reason} or null.
// First matching rule wins, ordered as authored.

export function evaluate(rules, call, ctx) {
  for (const rule of rules) {
    const hit = rule.when.every(cond => test(cond, call, ctx));
    if (hit) return { verdict: rule.then, reason: rule.id };
  }
  return { verdict: 'approve', reason: 'default' };
}

function test(cond, call, ctx) {
  const t = call.truth || {};
  switch (cond.k) {
    case 'truth':       return !!t[cond.f] === (cond.v !== false);
    case 'amountGt':    return call.amount > cond.v;
    case 'amountLt':    return call.amount < cond.v;
    case 'floorExceed': return call.amount > (ctx.floors.get(call.merchant) ?? 50);
    case 'floorUnder':  return call.amount <= (ctx.floors.get(call.merchant) ?? 50);
    case 'bulletin':    return ctx.bulletin.has(call.card.pan);
    case 'acctStatus':  return ctx.accounts.get(call.card.pan)?.status === cond.v;
    case 'acctOver':    { const a = ctx.accounts.get(call.card.pan);
                          return a && (a.balance + call.amount) > a.limit; }
    case 'expired':     return isExpired(call.card.exp, ctx.date);
    case 'merchantIs':  return call.merchant === cond.v;
    case 'terminalSays':return call.terminalVerdict === cond.v;
    case 'revealed':    return !!call.truth.revealed;
    case 'dateAfter':   return ctx.date >= cond.v;
    case 'dateBefore':  return ctx.date < cond.v;
    default: return false;
  }
}

function isExpired(exp, date) {
  // exp "MM/YY", valid through the last day of that month.
  const [month, shortYear] = exp.split('/').map(Number);
  const [year, currentMonth] = date.split('-').map(Number);
  const expiryYear = 1900 + shortYear;
  return year > expiryYear || (year === expiryYear && currentMonth > month);
}
