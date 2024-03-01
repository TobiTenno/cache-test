import Items from 'warframe-items';
import flatCache from 'flat-cache';
import data from 'warframe-worldstate-data';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from "node:url";

const dirName = dirname(fileURLToPath(import.meta.url));
const i18nOnObject = true;
const caches = ['weapons', 'warframes', 'items', 'mods'];

const cache = flatCache.load('.items', resolve(dirName));

const makeLanguageCache = (language) => {
  const base = {
    weapons: new Items({
      category: ['Primary', 'Secondary', 'Melee', 'Arch-Melee', 'Arch-Gun'],
      i18n: language,
      i18nOnObject,
    }),
    warframes: new Items({
      category: ['Warframes', 'Archwing'],
      i18n: language,
      i18nOnObject,
    }),
    items: new Items({
      i18n: language,
      i18nOnObject,
    }),
    mods: new Items({
      category: ['Mods'],
      i18n: language,
      i18nOnObject,
    }),
  };
  const merged = {};
  caches.forEach((cacheType) => {
    const subCache = base[cacheType];
    merged[cacheType] = [...subCache].map((item) => {
      let itemClone = { ...item };
      if (language !== 'en' && itemClone.i18n && itemClone.i18n[language]) {
        itemClone = {
          ...itemClone,
          ...itemClone.i18n[language],
        };
      }
      if (itemClone.abilities) {
        itemClone.abilities = itemClone.abilities.map((ability) => ({
          uniqueName: ability.abilityUniqueName || ability.uniqueName || undefined,
          name: ability.abilityName || ability.name,
          description: ability.abilityDescription || ability.description,
        }));
      }
      delete itemClone.i18n;
      return itemClone;
    });
    // console.info(`constructed ${cacheType} for ${language}`);
  });
  return merged;
};

data.locales.forEach((language) => {
  const cacheForLang = makeLanguageCache(language);
  caches.forEach((cacheType) => {
    try {
      cache.setKey(`${language}-${cacheType}`, cacheForLang[cacheType]);
    } catch (e) {
      console.error(`failed to set ${language}-${cacheType}`, e);
    }
  });
});
try {
  cache.setKey('last_updt', Date.now());
} catch (e) {
  console.error('failed to set last_updt', e);
}
try {
  cache.save(true);
} catch (e) {
  console.error('failed to save cache', e);
}
