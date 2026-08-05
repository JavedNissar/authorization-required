// The Weekly Compass — typeset newspaper frame renderer.
// Four pages early; later editions deliberately thin out.

export function renderPaperPage(c, w, h, d, page) {
  c.fillStyle = ink(d);
  if (page.masthead) {
    c.font = '700 30px Georgia, serif';
    c.fillText('The Weekly Compass', 28, 52);
    c.font = '11px Georgia, serif';
    c.fillText(`VOL. ${page.vol} · No. ${page.no} · ${page.date} · PRICE ${page.price || '10¢'}`, 28, 70);
    c.fillRect(28, 78, w - 56, 2);
  } else {
    c.font = '10px Georgia, serif';
    c.fillText(`The Weekly Compass — ${page.date} — Page ${page.n}`, 28, 26);
    c.fillRect(28, 32, w - 56, 1);
  }

  const cols = page.cols ?? 3;
  const colW = (w - 56 - (cols - 1) * 18) / cols;
  const top = page.masthead ? 92 : 44;
  const yMax = h - 24;
  const items = page.items || [];
  let col = 0, y = top;

  items.forEach((item, i) => {
    // Balance article blocks across the page rather than leaving two empty
    // columns merely because the first column did not quite overflow.
    while (col < cols - 1 && i >= Math.ceil(items.length * (col + 1) / cols)) {
      col += 1;
      y = top;
    }

    const x = 28 + col * (colW + 18);
    if (item.kind === 'blank') {
      y += item.h;
      if (y > yMax && col < cols - 1) { col += 1; y = top; }
      return;
    }

    c.fillStyle = ink(d);
    if (item.head) {
      c.font = `${item.big ? '700 17px' : '700 13px'} Georgia, serif`;
      y = wrapIn(c, item.head, x, y, colW, item.big ? 19 : 14, yMax);
    }
    if (item.body) {
      c.font = '10.5px Georgia, serif';
      y = wrapIn(c, item.body, x, y, colW, 12.5, yMax);
    }
    if (item.rule) { c.fillRect(x, y - 8, colW, 0.75); y += 6; }
    y += 10;
  });
}

function wrapIn(c, text, x, y, maxW, lh, yMax) {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (c.measureText(test).width > maxW) {
      if (line && y <= yMax) c.fillText(line, x, y);
      y += lh;
      line = word;
    } else line = test;
  }
  if (line && y <= yMax) { c.fillText(line, x, y); y += lh; }
  return y;
}

function ink(d) { const v = 36 + d * 8; return `rgb(${v},${v - 3},${v - 8})`; }
