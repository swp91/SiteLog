import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const command = process.argv[2]
const args = process.argv.slice(3)

if (!command) {
  console.error('Usage: node scripts/next-dist.mjs <dev|build|start> [...args]')
  process.exit(1)
}

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))
const nextBin = join(rootDir, 'node_modules', 'next', 'dist', 'bin', 'next')

const child = spawn(process.execPath, [nextBin, command, ...args], {
  cwd: rootDir,
  env: {
    ...process.env,
    NEXT_DIST_DIR: '.next-build',
  },
  stdio: 'inherit',
  shell: false,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
