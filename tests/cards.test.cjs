const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildBackup,
  parseBackup,
  parseStoredCards,
  planImport,
  reorderCards,
  matchesCard,
  isPortableImage,
} = require('../utils/cardData.ts');
const {
  detectBrand,
  normalizeExpiry,
  expiryStatus,
  looksLikeCardNumber,
  formatCardNumber,
} = require('../utils/cardNumber.ts');
const {
  defaultCardName,
  validateCardForm,
} = require('../utils/cardForm.ts');
const { extractCardData } = require('../utils/cardScanner.ts');
const { createCardsStore } = require('../store/createCardsStore.ts');
const card = (overrides = {}) => ({
  id: 'one',
  description: 'Everyday',
  cardholder: 'Taylor',
  number: '4111111111111111',
  expiry: '12/29',
  brand: 'VISA',
  variant: 'jade',
  ...overrides,
});
const other = card({
  id: 'two',
  number: '5555555555554444',
  brand: 'MASTERCARD',
});
const photo =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jk1sAAAAASUVORK5CYII=';
function memory(initial = null) {
  let value = initial;
  return {
    getItem: async () => value,
    setItem: async (_, next) => {
      value = next;
    },
    read: () => value,
  };
}

test('portable backup round-trips notes, both images, favorites and colors in order', () => {
  const cards = [
    card({
      note: 'Travel ✈️\nKeep this reminder',
      frontImage: photo,
      backImage: photo,
      favorite: true,
      cvv: '123',
    }),
    other,
  ];
  const restored = parseBackup(buildBackup(cards, true));
  assert.equal(restored[0].note, cards[0].note);
  assert.equal(restored[0].frontImage, photo);
  assert.equal(restored[0].backImage, photo);
  assert.equal(restored[0].cvv, '123');
  assert.equal(restored[0].favorite, true);
  assert.deepEqual(
    restored.map((c) => c.id),
    ['one', 'two'],
  );
});
test('security codes are excluded from exports by default', () => {
  assert.equal(
    parseBackup(buildBackup([card({ cvv: '123' })]))[0].cvv,
    undefined,
  );
});
test('legacy cards hydrate without introducing sample cards or losing fields', () => {
  const parsed = parseStoredCards([card()]);
  assert.equal(parsed[0].number, card().number);
  assert.equal(parsed[0].note, undefined);
  assert.deepEqual(parseStoredCards([]), []);
  assert.equal(parseBackup(JSON.stringify([card()])).length, 1);
});
test('malformed and unsupported backups are rejected', () => {
  for (const value of [
    '{',
    '{}',
    '{"format":"cardsaver","version":2,"cards":[]}',
    '{"format":"other","version":1,"cards":[]}',
    '{"format":"cardsaver","version":1,"cards":{}}',
  ])
    assert.throws(() => parseBackup(value));
  assert.throws(() => parseBackup(JSON.stringify([card({ variant: 'fake' })])));
  assert.throws(() =>
    parseBackup(JSON.stringify([card({ note: 'x'.repeat(2001) })])),
  );
  assert.throws(() =>
    parseBackup(JSON.stringify([card({ favorite: 'true' })])),
  );
  assert.throws(() => parseBackup(JSON.stringify([card({ number: 'short' })])));
});
test('backup photo validation rejects paths, remote URLs, SVGs and oversized images', () => {
  for (const frontImage of [
    'file:///private/secret',
    'https://example.com/photo.jpg',
    'card-images/../secret.jpg',
    'data:image/svg+xml;base64,PHN2Zz4=',
    'data:image/png;base64,' + 'a'.repeat(3 * 1024 * 1024),
  ]) {
    assert.throws(() => parseBackup(JSON.stringify([card({ frontImage })])));
  }
  assert.equal(isPortableImage(photo), true);
  assert.equal(
    parseStoredCards([card({ frontImage: 'card-images/card-abc.jpg' })])[0]
      .frontImage,
    'card-images/card-abc.jpg',
  );
  assert.throws(() =>
    buildBackup([card({ frontImage: 'card-images/card-abc.jpg' })]),
  );
});
test('unrecognized fields are discarded and BOM-prefixed JSON is accepted', () => {
  const parsed = parseBackup(
    '\uFEFF' + JSON.stringify([card({ malicious: true })]),
  );
  assert.equal(parsed[0].malicious, undefined);
});
test('duplicate card numbers are skipped, including duplicates within the file', () => {
  const { additions, skipped } = planImport(
    [card()],
    [
      card({ id: 'collision', note: 'Changed' }),
      other,
      { ...other, id: 'three' },
    ],
  );
  assert.equal(skipped, 2);
  assert.equal(additions.length, 1);
  assert.notEqual(additions[0].id, other.id);
  assert.equal(additions[0].number, other.number);
});
test('new IDs avoid collisions with imported IDs', () => {
  const { additions } = planImport([card()], [other]);
  assert.notEqual(additions[0].id, 'one');
  assert.notEqual(additions[0].id, 'two');
});
test('reorder preserves complete cards and rejects stale or incomplete orders', () => {
  const cards = [card({ note: 'Keep me' }), other];
  assert.deepEqual(reorderCards(cards, ['two', 'one']), [other, cards[0]]);
  for (const ids of [['one'], ['one', 'one'], ['one', 'missing']])
    assert.throws(() => reorderCards(cards, ids));
});
test('search covers notes, brand, name and formatted digits without accidental numeric matches', () => {
  const data = card({ note: 'Travel 2026' });
  for (const query of ['travel', 'VISA', 'taylor', '1111 1111'])
    assert.equal(matchesCard(data, query), true);
  assert.equal(matchesCard(data, 'nonexistent1111'), false);
});
test('brand detection handles Mastercard 2-series and avoids labeling every 3 or 6 as Amex/Discover', () => {
  assert.equal(detectBrand('2221000000000009'), 'MASTERCARD');
  assert.equal(detectBrand('2720990000000000'), 'MASTERCARD');
  assert.equal(detectBrand('30000000000000'), 'OTHER');
  assert.equal(detectBrand('6279354082930004'), 'OTHER');
  assert.equal(detectBrand('6011111111111117'), 'DISCOVER');
  assert.equal(detectBrand('378282246310005'), 'AMEX');
});
test('expiry accepts two/four digit years, rejects invalid months, and uses month boundaries', () => {
  assert.equal(normalizeExpiry('02/2030'), '02/30');
  assert.equal(normalizeExpiry('022030'), '02/30');
  for (const value of ['00/29', '13/29', '02/2', '02/203'])
    assert.equal(normalizeExpiry(value), null);
  const today = new Date(2026, 8, 30);
  assert.equal(expiryStatus('08/26', today), 'expired');
  assert.equal(expiryStatus('09/26', today), 'soon');
  assert.equal(expiryStatus('11/26', today), 'soon');
  assert.equal(expiryStatus('12/26', today), 'valid');
  assert.equal(expiryStatus('01/27', new Date(2026, 11, 31)), 'soon');
});
test('card form allows optional CVV and catches invalid digits', () => {
  assert.deepEqual(validateCardForm(card({ cvv: '', cardholder: '' })), {});
  assert.ok(validateCardForm(card({ cvv: '12' })).cvv);
  assert.ok(validateCardForm(card({ number: '4111111111111112' })).number);
  assert.deepEqual(
    validateCardForm(card({ number: '4111111111111112' }), '4111111111111112'),
    {},
  );
  assert.equal(formatCardNumber('378282246310005'), '3782 822463 10005');
  assert.equal(looksLikeCardNumber('4111111111111111'), true);
});
test('new card names use the first available Card number', () => {
  assert.equal(defaultCardName([]), 'Card 1');
  assert.equal(
    defaultCardName([
      { description: 'Personal' },
      { description: 'card 1' },
      { description: ' Card 3 ' },
    ]),
    'Card 2',
  );
});
test('scanner extracts expiry and formatted card number without joining unrelated text', () => {
  assert.deepEqual(
    extractCardData('VISA\n4111 1111 1111 1111\nVALID THRU 02/2030'),
    { number: '4111111111111111', expiry: '02/30' },
  );
  assert.equal(
    extractCardData('4111 1111\n1111 1111').number,
    '4111111111111111',
  );
  assert.equal(extractCardData('1234 points\n5678 rewards').number, undefined);
});
test('new wallets stay empty across reloads', async () => {
  const storage = memory();
  const store = createCardsStore(storage);
  await store.whenReady();
  assert.deepEqual(store.getSnapshot().cards, []);
  assert.equal(storage.read(), null);
});
test('mutations wait for hydration and preserve existing cards', async () => {
  let release;
  const storage = memory(JSON.stringify([card()]));
  const store = createCardsStore({
    ...storage,
    getItem: () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  });
  const adding = store.addCard(other);
  release(JSON.stringify([card()]));
  await adding;
  assert.equal(store.getSnapshot().cards.length, 2);
  assert.equal(store.getSnapshot().cards[1].id, 'one');
});
test('queued edits and order persist across a restart', async () => {
  const storage = memory(JSON.stringify([card(), other]));
  const store = createCardsStore(storage);
  await store.whenReady();
  await Promise.all([
    store.updateCard('one', {
      note: 'Updated',
      frontImage: 'card-images/a.jpg',
    }),
    store.reorder(['two', 'one']),
  ]);
  const restored = createCardsStore(storage);
  await restored.whenReady();
  assert.deepEqual(
    restored.getSnapshot().cards.map((c) => c.id),
    ['two', 'one'],
  );
  assert.equal(restored.getSnapshot().cards[1].note, 'Updated');
  assert.equal(restored.getSnapshot().cards[1].frontImage, 'card-images/a.jpg');
});
test('failed writes do not claim success or poison subsequent saves', async () => {
  let fail = true;
  const storage = memory(JSON.stringify([card()]));
  const store = createCardsStore({
    ...storage,
    setItem: async (key, value) => {
      if (fail) throw new Error('Disk full');
      return storage.setItem(key, value);
    },
  });
  await store.whenReady();
  await assert.rejects(store.updateCard('one', { note: 'Not saved' }));
  assert.equal(store.getSnapshot().cards[0].note, undefined);
  fail = false;
  await store.updateCard('one', { note: 'Saved' });
  assert.equal(store.getSnapshot().cards[0].note, 'Saved');
});
test('malformed stored data is preserved and cannot be overwritten by a mutation', async () => {
  const storage = memory('{broken');
  const store = createCardsStore(storage);
  await store.whenReady();
  assert.ok(store.getSnapshot().error);
  await assert.rejects(store.addCard(other));
  assert.equal(storage.read(), '{broken');
});
test('failed initial reads can be retried without resetting the wallet', async () => {
  let fail = true;
  const storage = memory(JSON.stringify([card()]));
  const store = createCardsStore({
    ...storage,
    getItem: async (key) => {
      if (fail) throw new Error('Unavailable');
      return storage.getItem(key);
    },
  });
  await store.whenReady();
  assert.ok(store.getSnapshot().error);
  fail = false;
  await store.retry();
  assert.equal(store.getSnapshot().cards[0].id, 'one');
});
test('import appends new cards in file order, retains existing details and deduplicates on a second import', async () => {
  const storage = memory(JSON.stringify([card({ note: 'Original' })]));
  const store = createCardsStore(storage);
  await store.whenReady();
  assert.deepEqual(
    await store.importCards([card({ note: 'Changed' }), other]),
    { added: 1, skipped: 1 },
  );
  assert.equal(store.getSnapshot().cards[0].note, 'Original');
  assert.deepEqual(await store.importCards([other]), { added: 0, skipped: 1 });
  const restored = createCardsStore(storage);
  await restored.whenReady();
  assert.equal(restored.getSnapshot().cards.length, 2);
});
test('duplicate additions/edits are rejected and deletion survives reload', async () => {
  const storage = memory(JSON.stringify([card(), other]));
  const store = createCardsStore(storage);
  await store.whenReady();
  await assert.rejects(store.addCard(card()));
  await assert.rejects(store.updateCard('two', { number: card().number }));
  await store.removeCard('one');
  const restored = createCardsStore(storage);
  await restored.whenReady();
  assert.deepEqual(
    restored.getSnapshot().cards.map((c) => c.id),
    ['two'],
  );
});
test('clearing a wallet removes every card and survives reload', async () => {
  const storage = memory(JSON.stringify([card(), other]));
  const store = createCardsStore(storage);
  await store.whenReady();
  await store.clear();
  assert.deepEqual(store.getSnapshot().cards, []);
  const restored = createCardsStore(storage);
  await restored.whenReady();
  assert.deepEqual(restored.getSnapshot().cards, []);
});
test('explicit clear can recover a wallet with malformed stored data', async () => {
  const storage = memory('{broken');
  const store = createCardsStore(storage);
  await store.whenReady();
  assert.ok(store.getSnapshot().error);
  await store.clear();
  assert.deepEqual(store.getSnapshot(), {
    cards: [],
    loading: false,
    error: null,
  });
  assert.equal(storage.read(), '[]');
});
