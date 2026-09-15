import { readFileSync, writeFileSync } from 'node:fs';

const path = new URL('../dist/server/wrangler.json', import.meta.url);
const config = JSON.parse(readFileSync(path, 'utf8'));

function uniqueBy(list, key) {
  const seen = new Set();
  return (list ?? []).filter((item) => {
    const id = item[key];
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function stripRemote(list) {
  return list.map(({ remote, ...rest }) => rest);
}

config.d1_databases = stripRemote(uniqueBy(config.d1_databases, 'binding'));
config.r2_buckets = stripRemote(uniqueBy(config.r2_buckets, 'binding'));

writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`);
