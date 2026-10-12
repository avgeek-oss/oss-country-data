# Country Data

Country reference data and localized names for JavaScript applications. Includes
249 ISO countries and territories, with no runtime dependencies or network calls.
Flag artwork is hosted separately as SVGs on `oss-country-flags.avgeek.ltd`.

The package is prepared for npm as `@avgeek-oss/country-data`. It has not been
published yet. It exports ESM and TypeScript declarations for Node.js 22+ and
modern browser bundlers.

```ts
import {
  getCountry, getCountryName, getCountryFlagUrl, getCountryOptions,
  filterCountries, searchCountries, getCountriesByCallingCode,
} from '@avgeek-oss/country-data';

getCountry('in');          // India; also accepts IND or 356
getCountryName('IN', 'ta'); // இந்தியா
getCountryFlagUrl('IN');   // https://oss-country-flags.avgeek.ltd/in.svg
getCountryOptions({ locale: 'fr', filter: { isIndependent: true } });
filterCountries({ currencyCode: 'EUR', isLandlocked: true });
searchCountries('भारत', 'hi');
getCountriesByCallingCode('+1'); // All matching countries/territories
```

## API

| Export | Purpose |
| --- | --- |
| `countries` | Deeply frozen country snapshot, sorted by alpha-2 code |
| `getCountry(code)` | Find by alpha-2, alpha-3, or three-digit numeric string |
| `getCountryByAlphaTwo(code)` | Find by alpha-2 code |
| `getCountryByAlphaThree(code)` | Find by alpha-3 code |
| `getCountryByNumeric(code)` | Find by numeric string, retaining leading zeros |
| `getCountryName(code, locale?)` | Localized common display name |
| `getCountryFlagUrl(code)` | Curated SVG URL |
| `getCountryOptions({ locale?, filter? })` | Localized, sorted `{ value, label, flagUrl }` picker options |
| `filterCountries(filter?)` | Combine geographic, currency, language, timezone, independence, driving, and measurement filters |
| `searchCountries(query, locale?)` | Search codes, names, aliases, native names, and localized names |
| `getCountriesByCallingCode(code)` | Find every country sharing a calling code |
| `getParentCountry(code)` | Find the administering/realm country, if recorded |
| `getCountryTerritories(code)` | Find territories linked to a country |
| `resolveLocale(locale?)` | Resolve a BCP 47 locale to bundled localization |
| `supportedLocales` | List the bundled locales |
| `datasetInfo` | Snapshot and localization versions |

Unknown country codes return `undefined`; unknown calling codes return an empty
array. Codes are trimmed and alpha codes are case-insensitive. Numeric codes are
strings: use `"004"`, not `4`. Calling-code lookup is not phone-number parsing;
use a phone library for complete number validation and territory resolution.
Empty search text returns an empty array. Search removes diacritics and uses
substring matching; it does not transliterate scripts or apply fuzzy ranking.

All supplied filters must match. Region/subregion filters use UN M49 digit
strings. `officialLanguageCode` uses the stored ISO language codes, generally
ISO 639-3 (`eng`, `hin`), rather than the BCP 47 keys used for localization.
IANA timezone identifiers are matched exactly. Results containing countries
reference immutable data; modify copies if an application needs editable state.

## Localization

Country display names come from Unicode CLDR 48.2, not machine translation.
There are 24 languages and 25 locale maps:

English, Arabic, Bengali, German, Spanish, Persian, French, Gujarati, Hindi,
Indonesian, Italian, Japanese, Korean, Marathi, Punjabi, Portuguese, Russian,
Swahili, Tamil, Telugu, Turkish, Urdu, Vietnamese, and Chinese (Simplified and
Traditional).

`countryLocalizedNames` is a locale-to-name object on each country. These are
common display names, not translations of official legal names. Locale fallback
is exact supported locale, supported base language, then English. Traditional
Chinese regional locales such as `zh-TW` and `zh-HK` resolve to `zh-Hant`.
Invalid BCP 47 tags throw `RangeError`; unsupported valid locales fall back to
English. Picker labels are sorted with `Intl.Collator`, so order can vary with
the runtime's ICU version. Country name content comes from the pinned snapshot.

## Data and maintenance

[Rootset Countries](https://rootset.avgeek.ltd/databases/01M4S2E5C9R8FYHH9VR7XT9ZBT/tables/01M4S2EBZY9FA6B57E9C0CKMBR)
is the editable source of truth. `src/countries.json` is the release snapshot;
applications do not contact Rootset. The `/data` export provides the same raw
JSON snapshot for non-function consumers.

The snapshot includes identifiers, official/native names and aliases, regional
classification, capitals, currencies, official language codes, IANA timezones,
country-code domains, calling codes and known area suffixes, driving side,
measurement defaults, independence and parent relationships, flag URLs, and the
last verification timestamp. Nulls mean a value is unavailable, inapplicable,
or intentionally unassigned; they must not be interpreted as false or an empty
identifier. Known area suffixes are not a complete dialing plan.

`isIndependent` is deliberately null for Palestine, Taiwan, Western Sahara,
Cook Islands, and Niue. Parent links describe administration or realm
relationships, not a general sovereignty adjudication; freely associated states
are not treated as dependencies. Antarctica is not assigned a parent.
`measurementSystem` follows CLDR defaults (`metric`, `ussystem`, `uksystem`),
not a claim that every measurement in a country uses that system.

To refresh, export all rows from Rootset as a JSON array (row objects with
`values`, or plain country objects), then run:

```sh
npm ci
node scripts/import-rootset.mjs /absolute/path/countries-export.json
npm run verify
```

Review the snapshot diff, update `datasetInfo` when its date/schema changes,
and commit it before release. Do not put Rootset credentials in this repository.
Import fails on missing fields, duplicate ISO identifiers, incomplete locale
maps, or missing parent references. Tests validate the data and public API.
Package verification installs the packed tarball into a clean temporary project
and checks JavaScript and TypeScript consumers.

## Licensing

Package code is MIT. The country database includes ODbL-1.0-derived reference
data; localized names are Unicode-3.0. See `NOTICE.md`, `LICENSE-DATA`, and
`LICENSE-UNICODE` for source attribution and data-license terms. License notices
are included in the npm tarball. A future public release must preserve them.
