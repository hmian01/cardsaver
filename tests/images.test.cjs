const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const files = new Map();
let failWrite = 0;
let writes = 0;
let failRender = false;
let released = 0;
let pickerOptions;
const fs = {
  documentDirectory: 'file:///documents/',
  cacheDirectory: 'file:///cache/',
  EncodingType: { Base64: 'base64' },
  makeDirectoryAsync: async () => {},
  writeAsStringAsync: async (uri, data) => {
    writes++;
    if (writes === failWrite) throw new Error('Storage full');
    files.set(uri, data);
  },
  readAsStringAsync: async (uri) => {
    if (!files.has(uri)) throw new Error('Missing file');
    return files.get(uri);
  },
  deleteAsync: async (uri) => {
    files.delete(uri);
  },
};
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'react-native') return { Platform: { OS: 'ios' } };
  if (request === 'expo-file-system/legacy') return fs;
  if (request === 'expo-image-picker')
    return {
      launchImageLibraryAsync: async (options) => {
        pickerOptions = options;
        return {
          canceled: false,
          assets: [
            { uri: 'file:///cache/picked.jpg', width: 2500, height: 1500 },
          ],
        };
      },
    };
  if (request === 'expo-image-manipulator')
    return {
      SaveFormat: { JPEG: 'jpeg' },
      ImageManipulator: {
        manipulate: () => ({
          resize: () => {},
          release: () => {
            released++;
          },
          renderAsync: async () => {
            if (failRender) throw new Error('Bad image');
            return {
              release: () => {
                released++;
              },
              saveAsync: async () => ({
                uri: 'file:///cache/resized.jpg',
                base64: 'YWJjZA==',
              }),
            };
          },
        }),
      },
    };
  return originalLoad.call(this, request, parent, isMain);
};
const {
  imageUri,
  materializeImages,
  portableImages,
  removeImages,
  pickCardImage,
} = require('../utils/cardImages.ts');
Module._load = originalLoad;
const photo = 'data:image/jpeg;base64,YWJjZA==';
const card = {
  id: 'card-one',
  description: 'Everyday',
  cardholder: 'Taylor',
  number: '4111111111111111',
  expiry: '12/29',
  brand: 'VISA',
  variant: 'jade',
};
beforeEach(() => {
  files.clear();
  failWrite = 0;
  writes = 0;
  failRender = false;
  released = 0;
});

test('native photo attachments are stored as relative document paths and exported as embedded images', async () => {
  const { card: saved, created } = await materializeImages({
    ...card,
    frontImage: photo,
    backImage: photo,
  });
  assert.equal(created.length, 2);
  assert.match(saved.frontImage, /^card-images\/card-.*\.jpg$/);
  assert.equal(files.get(imageUri(saved.frontImage)), 'YWJjZA==');
  const exported = await portableImages(saved, true);
  assert.equal(exported.frontImage, photo);
  assert.equal(exported.backImage, photo);
  const withoutPhotos = await portableImages(saved, false);
  assert.equal(withoutPhotos.frontImage, undefined);
  assert.equal(withoutPhotos.backImage, undefined);
});
test('failed photo writes roll back all newly created attachments', async () => {
  failWrite = 2;
  await assert.rejects(
    materializeImages({ ...card, frontImage: photo, backImage: photo }),
    /Storage full/,
  );
  assert.equal(files.size, 0);
});
test('photo cleanup preserves attachments still used by a card and never touches unrelated paths', async () => {
  files.set('file:///documents/card-images/old.jpg', 'old');
  files.set('file:///documents/card-images/shared.jpg', 'shared');
  files.set('file:///unrelated.jpg', 'leave alone');
  await removeImages(
    ['card-images/old.jpg', 'card-images/shared.jpg', 'file:///unrelated.jpg'],
    [{ ...card, frontImage: 'card-images/shared.jpg' }],
  );
  assert.equal(files.has('file:///documents/card-images/old.jpg'), false);
  assert.equal(files.has('file:///documents/card-images/shared.jpg'), true);
  assert.equal(files.has('file:///unrelated.jpg'), true);
});
test('missing saved images produce a useful export error', async () => {
  await assert.rejects(
    portableImages({ ...card, frontImage: 'card-images/missing.jpg' }, true),
    /A photo for “Everyday” is missing/,
  );
});
test('photo selection uses an integer crop ratio and cleans temporary image files', async () => {
  files.set('file:///cache/picked.jpg', 'original');
  files.set('file:///cache/resized.jpg', 'resized');
  assert.equal(await pickCardImage(), photo);
  assert.ok(pickerOptions.aspect.every(Number.isInteger));
  assert.equal(files.size, 0);
  assert.equal(released, 2);
});
test('failed image processing releases its native context and removes the picker copy', async () => {
  files.set('file:///cache/picked.jpg', 'original');
  failRender = true;
  await assert.rejects(pickCardImage(), /Bad image/);
  assert.equal(files.size, 0);
  assert.equal(released, 1);
});
