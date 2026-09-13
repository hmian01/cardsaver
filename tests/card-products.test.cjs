const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  detectCardProduct,
  resolveCardIdentity,
} = require('../utils/cardProducts.ts');
const {
  buildBackup,
  parseBackup,
  parseStoredCards,
  matchesCard,
} = require('../utils/cardData.ts');
const { extractCardData } = require('../utils/cardScanner.ts');
const { createCardsStore } = require('../store/createCardsStore.ts');

const visa = '4111111111111111';
const amex = '378282246310005';
const card = (overrides = {}) => ({
  id: 'test',
  description: 'Travel',
  number: visa,
  brand: 'VISA',
  cardholder: 'A Person',
  expiry: '12/30',
  variant: 'jade',
  ...overrides,
});

test('recognizes the requested personal, debit, and business products', () => {
  const examples = {
    'Chase debit': 'chase-debit',
    'Chase business debit': 'chase-business-debit',
    'Chase Freedom Unlimited': 'chase-freedom-unlimited',
    'Chase Sapphire Preferred': 'chase-sapphire-preferred',
    'Amex Gold': 'amex-gold',
    'Amex Blue Business Plus': 'amex-blue-business-plus',
    'Chase Ink Preferred': 'chase-ink-preferred',
    'Chase Ink Unlimited': 'chase-ink-unlimited',
    'Chase Ink Cash': 'chase-ink-cash',
    'Wells debit': 'wells-fargo-debit',
    'Wells business debit': 'wells-fargo-business-debit',
    'Capital One debit': 'capital-one-debit',
    'Capital One Venture': 'capital-one-venture',
    'Capital One Venture X': 'capital-one-venture-x',
    'Capital One Quicksilver': 'capital-one-quicksilver',
    'Chime debit': 'chime-debit',
    'Fidelity HSA': 'fidelity-hsa',
    'US Bank business debit': 'us-bank-business-debit',
    'BofA Atmos Ascent': 'bofa-atmos-ascent',
    'Associated business': 'associated-business-debit',
    'Citi AAdvantage Platinum Select': 'citi-aadvantage-platinum-select',
    'Amex White Gold': 'amex-white-gold',
    'SoFi debit': 'sofi-debit',
    'Chase Prime': 'chase-prime-visa',
  };
  for (const [name, expected] of Object.entries(examples))
    assert.equal(detectCardProduct(name)?.id, expected, name);
});
test('normalizes OCR line breaks, punctuation, abbreviations and case', () => {
  assert.equal(
    detectCardProduct('CHASE\nSAPPHIRE®\nPREFERRED', visa)?.id,
    'chase-sapphire-preferred',
  );
  assert.equal(
    detectCardProduct('AMERICAN EXPRESS\nBLUE BIZ PLUS', amex)?.id,
    'amex-blue-business-plus',
  );
  assert.equal(
    detectCardProduct('capital one venture x&#x20;', visa)?.id,
    'capital-one-venture-x',
  );
});
test('does not infer a product from a PAN, generic tier, ambiguous name or incompatible network', () => {
  for (const text of [
    visa,
    amex,
    'Gold',
    'Chase',
    'Chase Freedom',
    'Chase Sapphire',
    'Chase business',
    'Amex biz blue',
    'Delta Amex Gold',
    'Amex Business Gold',
    'Sapphire Reserve Business',
    'Venture X Business',
    'QuicksilverOne',
    'Capital One Quicksilver One',
    'Chime Credit Builder',
    'Citi AAdvantage Executive',
    'Atmos Summit',
    'Chase Venture',
    'Chase Sapphire Preferred and Amex Gold',
  ]) {
    assert.equal(detectCardProduct(text), undefined, text);
  }
  assert.equal(detectCardProduct('Amex Gold', visa), undefined);
  assert.equal(detectCardProduct('Chase Sapphire Preferred', amex), undefined);
});
test('longer product names beat overlapping base names', () => {
  assert.equal(
    detectCardProduct('Capital One Venture X')?.id,
    'capital-one-venture-x',
  );
  assert.equal(
    detectCardProduct('Capital One Savor One')?.id,
    'capital-one-savorone',
  );
  assert.equal(
    detectCardProduct('Capital One Venture One')?.id,
    'capital-one-ventureone',
  );
  assert.equal(detectCardProduct('Amex White Gold')?.id, 'amex-white-gold');
  assert.equal(detectCardProduct('Amex Gold')?.id, 'amex-gold');
});
test('scanner carries a product with number/expiry and can identify a front without a PAN', () => {
  assert.deepEqual(
    extractCardData(`CHASE\nSAPPHIRE PREFERRED\n${visa}\n12/30`),
    { number: visa, expiry: '12/30', productId: 'chase-sapphire-preferred' },
  );
  assert.deepEqual(extractCardData('AMERICAN EXPRESS\nBLUE BUSINESS PLUS'), {
    number: undefined,
    expiry: undefined,
    productId: 'amex-blue-business-plus',
  });
  assert.equal(extractCardData(`AMEX GOLD\n${visa}`).productId, undefined);
});
test('explicit selection survives a nickname; automatic matches react to edits', () => {
  assert.equal(
    resolveCardIdentity(card({ productId: 'chase-sapphire-preferred' })).product
      .id,
    'chase-sapphire-preferred',
  );
  assert.equal(
    resolveCardIdentity(card({ description: 'Chase Freedom Unlimited' }))
      .product.id,
    'chase-freedom-unlimited',
  );
  assert.equal(resolveCardIdentity(card()).product, undefined);
  assert.equal(
    resolveCardIdentity(card({ productId: 'amex-gold' })).product,
    undefined,
  );
  assert.equal(
    resolveCardIdentity(
      card({
        productId: 'future-product',
        description: 'Chase Freedom Unlimited',
      }),
    ).product,
    undefined,
  );
});
test('color preference keeps product identity and network while disabling its artwork', () => {
  const identity = resolveCardIdentity(
    card({ productId: 'chase-sapphire-preferred', artwork: 'color' }),
  );
  assert.equal(identity.product.id, 'chase-sapphire-preferred');
  assert.equal(identity.network, 'VISA');
  assert.equal(identity.useArtwork, false);
});
test('legacy wallets gain artwork without migrations and unknown future product IDs survive backups', () => {
  const legacy = parseStoredCards([
    card({ description: 'Chase Sapphire Preferred' }),
  ])[0];
  assert.equal(resolveCardIdentity(legacy).useArtwork, true);
  for (const productId of ['chase-sapphire-preferred', 'future-card']) {
    const restored = parseBackup(
      buildBackup([card({ productId, artwork: 'color' })]),
    )[0];
    assert.equal(restored.productId, productId);
    assert.equal(restored.artwork, 'color');
  }
});
test('backup validation rejects malformed design fields and arbitrary URLs', () => {
  for (const patch of [
    { productId: 7 },
    { productId: '../file' },
    { productId: 'https://example.com/card.png' },
    { artwork: 'photo' },
    { artwork: null },
  ]) {
    assert.throws(() => parseStoredCards([card(patch)]));
  }
});
test('product selections persist after restart and can be searched by bank or product', async () => {
  let saved = null;
  const storage = {
    getItem: async () => saved,
    setItem: async (_, value) => {
      saved = value;
    },
  };
  const store = createCardsStore(storage);
  await store.whenReady();
  const added = await store.addCard(
    card({ productId: 'chase-sapphire-preferred', artwork: 'auto' }),
  );
  await store.updateCard(added.id, { description: 'My travel card' });
  const reopened = createCardsStore(storage);
  await reopened.whenReady();
  const restored = reopened.getSnapshot().cards[0];
  assert.equal(
    resolveCardIdentity(restored).product.id,
    'chase-sapphire-preferred',
  );
  assert.equal(matchesCard(restored, 'chase'), true);
  assert.equal(matchesCard(restored, 'sapphire preferred'), true);
});
