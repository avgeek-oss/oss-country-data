import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'country-data-package-'));
try {
  const packed = JSON.parse(execFileSync('npm', ['pack', '--json', '--pack-destination', temporary], { cwd: root, encoding: 'utf8' }))[0];
  const files = new Set(packed.files.map(file => file.path));
  for (const file of ['dist/index.js', 'dist/index.d.ts', 'dist/countries.json', 'LICENSE', 'LICENSE-DATA', 'LICENSE-UNICODE', 'NOTICE.md']) assert.ok(files.has(file), `Missing ${file}`);
  assert.ok(![...files].some(path => path.startsWith('src/') || path.includes('.env')));
  await writeFile(join(temporary, 'package.json'), '{"type":"module","private":true}');
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', join(temporary, packed.filename)], { cwd: temporary, stdio: 'pipe' });
  const consumer = `import { getCountry, getCountryName, getCountryOptions } from '@avgeek-oss/country-data';
    import data from '@avgeek-oss/country-data/data' with { type: 'json' };
    if (getCountry('IND')?.countryNumeric !== '356' || getCountryName('IN', 'ta') !== 'இந்தியா' || data.length !== 249 || getCountryOptions().length !== 249) throw new Error('Packed API failed');`;
  await writeFile(join(temporary, 'consumer.mjs'), consumer);
  execFileSync(process.execPath, [join(temporary, 'consumer.mjs')], { cwd: temporary, stdio: 'pipe' });
  await writeFile(join(temporary, 'consumer.ts'), `import { getCountry, filterCountries, type Country } from '@avgeek-oss/country-data';
    const country: Country | undefined = getCountry('IN');
    filterCountries({ isIndependent: true, currencyCode: 'INR' });
    if (country) {
      // @ts-expect-error Country records are immutable.
      country.countryName = 'Changed';
      // @ts-expect-error Nested arrays are immutable.
      country.currencyCodes.push('XXX');
    }
    // @ts-expect-error Invalid measurement system.
    filterCountries({ measurementSystem: 'imperial' });`);
  execFileSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--module', 'NodeNext', '--target', 'ES2022', 'consumer.ts'], { cwd: temporary, stdio: 'pipe' });
  console.log(`Packed JavaScript and TypeScript consumers passed (${packed.size} bytes compressed).`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
