import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../../data')

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
}

function getMemoryPath(userId) {
  return join(DATA_DIR, `memory-${userId}.md`)
}

export function readMemoryFile(userId) {
  const path = getMemoryPath(userId)
  if (!existsSync(path)) return ''
  return readFileSync(path, 'utf-8')
}

export function writeMemoryFile(userId, content) {
  ensureDataDir()
  writeFileSync(getMemoryPath(userId), content, 'utf-8')
}

// Replace or create a named section in the memory file
export function writeMemorySection(userId, section, content) {
  let mem = readMemoryFile(userId)
  const header = `## ${section}`
  const sectionRegex = new RegExp(`## ${escapeRegex(section)}[\\s\\S]*?(?=\\n## |$)`)

  if (sectionRegex.test(mem)) {
    mem = mem.replace(sectionRegex, `${header}\n${content.trim()}`)
  } else {
    mem = mem.trim() + `\n\n${header}\n${content.trim()}`
  }

  writeMemoryFile(userId, mem.trim() + '\n')
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
