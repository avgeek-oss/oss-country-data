import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../infra/flag-redirect/index.mjs';

test('legacy flag URLs redirect permanently to public assets for GET and HEAD', () => {
  for (const method of ['GET', 'HEAD']) {
    const response = worker.fetch(new Request('https://oss-country-flags.avgeek.ltd/in.svg?v=1', { method }));
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('Location'), 'https://assets.avgeek.io/country-flags/in.svg?v=1');
  }
});

test('legacy redirect rejects unrelated paths and write methods', () => {
  for (const path of ['/', '/IN.svg', '/nested/in.svg', '//example.com/in.svg']) {
    assert.equal(worker.fetch(new Request('https://oss-country-flags.avgeek.ltd' + path)).status, 404);
  }
  const response = worker.fetch(new Request('https://oss-country-flags.avgeek.ltd/in.svg', { method: 'POST' }));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'GET, HEAD');
});
