import { copyFile, mkdir, readdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
assert.deepEqual(await readdir('dist'), ['index.html'], 'Preview must contain exactly one HTML file')
await mkdir('../docs', { recursive: true })
await copyFile('dist/index.html', '../index.html')
await copyFile('dist/index.html', '../docs/index.html')
console.log('Self-contained hash preview copied to index.html and docs/index.html')
// TEMP: print the built preview into the Check log so it can be committed. Removed in the next commit.
{
  const { readFile } = await import('node:fs/promises')
  const { gzipSync } = await import('node:zlib')
  const b64 = gzipSync(await readFile('dist/index.html'), { level: 9 }).toString('base64')
  for (let i = 0; i < b64.length; i += 4000) console.log('PREVIEWB64 ' + b64.slice(i, i + 4000))
  console.log('PREVIEWEND')
}
