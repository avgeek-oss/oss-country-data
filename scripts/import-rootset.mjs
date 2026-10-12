import { readFile, writeFile } from 'node:fs/promises';
import { validateData } from './validate-data.mjs';

const path = process.argv[2];
if (!path) throw new Error('Usage: node scripts/import-rootset.mjs /absolute/path/export.json');
const exported = JSON.parse(await readFile(path, 'utf8'));
if (!Array.isArray(exported)) throw new Error('Export must be a complete JSON array of rows or country objects');
const countries = validateData(exported.map(row => row.values ?? row))
  .sort((a, b) => a.countryAlphaTwo.localeCompare(b.countryAlphaTwo));
await writeFile(new URL('../src/countries.json', import.meta.url), `${JSON.stringify(countries, null, 2)}\n`);
console.log(`Imported ${countries.length} countries. Review the diff and run npm run verify.`);
