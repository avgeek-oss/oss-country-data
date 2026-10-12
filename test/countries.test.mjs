import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countries, supportedLocales, getCountry, getCountryByAlphaTwo, getCountryByAlphaThree,
  getCountryByNumeric, getCountryName, getCountryFlagUrl, resolveLocale,
  getCountryOptions, searchCountries, filterCountries, getParentCountry,
  getCountryTerritories, getCountriesByCallingCode,
} from '../dist/index.js';
import { validateData } from '../scripts/validate-data.mjs';

test('snapshot is complete and structurally valid', () => {
  validateData(countries);
  assert.equal(supportedLocales.length, 25);
  assert.deepEqual(countries.map(c => c.countryAlphaTwo), [...countries.map(c => c.countryAlphaTwo)].sort());
  assert.ok(!getCountry('XK') && !getCountry('AN') && !getCountry('CS'));
});

test('all identifiers round-trip without losing leading zeros', () => {
  for (const country of countries) {
    for (const code of [country.countryAlphaTwo, country.countryAlphaThree, country.countryNumeric]) assert.equal(getCountry(code), country);
    assert.equal(getCountryByAlphaTwo(country.countryAlphaTwo.toLowerCase()), country);
    assert.equal(getCountryByAlphaThree(country.countryAlphaThree.toLowerCase()), country);
    assert.equal(getCountryByNumeric(country.countryNumeric), country);
  }
  assert.equal(getCountry(' in '), getCountry('IND'));
  assert.equal(getCountry('004').countryAlphaTwo, 'AF');
  assert.equal(getCountryByNumeric('4'), undefined);
  assert.equal(getCountry('ZZ'), undefined);
  assert.equal(getCountry(''), undefined);
});

test('localized names handle regional locales, scripts, and unsupported locales', () => {
  assert.equal(getCountryName('IN', 'ta'), 'இந்தியா');
  assert.equal(getCountryName('DE', 'fr-FR'), 'Allemagne');
  assert.equal(getCountryName('US', 'es'), 'Estados Unidos');
  assert.equal(resolveLocale('zh-TW'), 'zh-Hant');
  assert.equal(resolveLocale('zh-HK'), 'zh-Hant');
  assert.equal(resolveLocale('zh-Hans-TW'), 'zh');
  assert.equal(resolveLocale('pt-BR'), 'pt');
  assert.equal(resolveLocale('fi'), 'en');
  assert.equal(getCountryName('IN', 'fi'), 'India');
  assert.equal(getCountryName('ZZ', 'ta'), undefined);
  assert.throws(() => resolveLocale('bad_locale'), RangeError);
  for (const country of countries) for (const locale of supportedLocales) assert.ok(getCountryName(country.countryAlphaTwo, locale));
});

test('calling-code lookups preserve one-to-many relationships and exclude missing codes', () => {
  assert.deepEqual(getCountriesByCallingCode('+91').map(c => c.countryAlphaTwo), ['IN']);
  const shared = getCountriesByCallingCode('1').map(c => c.countryAlphaTwo);
  assert.ok(shared.includes('US') && shared.includes('CA') && shared.includes('PR'));
  assert.ok(shared.length > 20);
  assert.deepEqual(getCountriesByCallingCode('999'), []);
  assert.deepEqual(getCountriesByCallingCode('+1 212'), []);
  assert.deepEqual(getCountriesByCallingCode(''), []);
  assert.equal(getCountry('SH').phoneCallingCode, '290');
});

test('filters intersect and exclude unknown independence states', () => {
  const matches = filterCountries({ currencyCode: 'eur', isLandlocked: true, regionCode: '150' });
  assert.ok(matches.some(c => c.countryAlphaTwo === 'AT'));
  assert.ok(matches.every(c => c.currencyCodes.includes('EUR') && c.isLandlocked && c.regionCode === '150'));
  assert.ok(filterCountries({ officialLanguageCode: 'hin', timeZoneId: 'Asia/Kolkata' }).some(c => c.countryAlphaTwo === 'IN'));
  assert.equal(filterCountries({ isIndependent: true }).length, 194);
  assert.equal(filterCountries({ isIndependent: false }).length, 50);
  assert.equal(filterCountries({ isLandlocked: true }).length, 44);
  assert.ok(filterCountries({ drivingSide: 'left', measurementSystem: 'metric' }).some(c => c.countryAlphaTwo === 'IN'));
  assert.ok(filterCountries({ subregionCode: '034' }).some(c => c.countryAlphaTwo === 'IN'));
});

test('territory relations resolve from either alpha code and leave free association unassigned', () => {
  assert.equal(getParentCountry('HKG').countryAlphaTwo, 'CN');
  assert.ok(getCountryTerritories('GBR').some(c => c.countryAlphaTwo === 'GI'));
  assert.equal(getParentCountry('CK'), undefined);
  assert.equal(getParentCountry('IN'), undefined);
  assert.deepEqual(getCountryTerritories('ZZ'), []);
});

test('search supports localized scripts, aliases, and diacritics', () => {
  assert.ok(searchCountries('भारत', 'hi').some(c => c.countryAlphaTwo === 'IN'));
  assert.ok(searchCountries('Allemagne', 'fr').some(c => c.countryAlphaTwo === 'DE'));
  assert.ok(searchCountries('cote', 'fr').some(c => c.countryAlphaTwo === 'CI'));
  assert.ok(searchCountries('004').some(c => c.countryAlphaTwo === 'AF'));
  assert.deepEqual(searchCountries('   '), []);
  assert.deepEqual(searchCountries('no-such-country-xyz'), []);
});

test('picker options are localized, filtered, sorted, and isolated from the snapshot', () => {
  const options = getCountryOptions({ locale: 'fr', filter: { isIndependent: true } });
  assert.equal(options.length, 194);
  assert.equal(options.find(o => o.value === 'DE').label, 'Allemagne');
  const collator = new Intl.Collator('fr');
  for (let i = 1; i < options.length; i++) assert.ok(collator.compare(options[i - 1].label, options[i].label) <= 0);
  options[0].label = 'Changed';
  assert.notEqual(getCountryOptions({ locale: 'fr', filter: { isIndependent: true } })[0].label, 'Changed');
  assert.equal(getCountryFlagUrl('in'), 'https://oss-country-flags.avgeek.ltd/in.svg');
  assert.equal(getCountryFlagUrl('ZZ'), undefined);
});

test('nested shared data cannot be mutated by consumers', () => {
  const country = getCountry('IN');
  assert.throws(() => { country.countryName = 'Changed'; }, TypeError);
  assert.throws(() => { country.currencyCodes.push('XXX'); }, TypeError);
  assert.throws(() => { country.countryLocalizedNames.ta = 'Changed'; }, TypeError);
  assert.throws(() => { country.capitalCities[0].roles.push('test'); }, TypeError);
});
