import fs from 'node:fs'
import path from 'node:path'

const COVERAGE_FILE = path.resolve(process.cwd(), process.env.COVERAGE_FILE ?? 'coverage/coverage-final.json')
const GUARD_CONFIG = process.env.COVERAGE_GUARDS ?? 'config/testing/coverage-guards.json'

type Metric = 'statements' | 'branches' | 'functions' | 'lines'

type CoverageMap = Record<string, CoverageEntry>

type CoverageEntry = {
  path: string
  statementMap?: Record<string, unknown>
  fnMap?: Record<string, unknown>
  branchMap?: Record<string, BranchEntry>
  s?: Record<string, number>
  f?: Record<string, number>
  b?: Record<string, number[]>
}

type BranchEntry = {
  locations?: Array<unknown>
  location?: unknown
}

type MetricTotals = Record<Metric, { covered: number; total: number }>

type GuardSeverity = 'error' | 'warn'

type CoverageGuard = {
  file: string
  enabled?: boolean
  severity?: GuardSeverity
} & Partial<Record<Metric, number>>

const metrics: Metric[] = ['statements', 'branches', 'functions', 'lines']

function formatPercent(covered: number, total: number): string {
  if (total === 0) return '0.00%'
  return `${((covered / total) * 100).toFixed(2)}%`
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/')
}

function collectEntryCoverage(entry: CoverageEntry, metric: Metric): { covered: number; total: number } {
  switch (metric) {
    case 'statements': {
      const total = Object.keys(entry.statementMap ?? {}).length
      const covered = Object.values(entry.s ?? {}).filter((count) => count > 0).length
      return { covered, total }
    }
    case 'functions': {
      const total = Object.keys(entry.fnMap ?? {}).length
      const covered = Object.values(entry.f ?? {}).filter((count) => count > 0).length
      return { covered, total }
    }
    case 'branches': {
      const branchMap = entry.branchMap ?? {}
      const total = Object.values(branchMap).reduce((sum, branch) => {
        if (Array.isArray(branch.locations)) {
          return sum + branch.locations.length
        }
        if (branch.location) {
          return sum + 1
        }
        return sum
      }, 0)
      const covered = Object.values(entry.b ?? {}).reduce((sum, counts) => {
        return sum + counts.filter((count) => count > 0).length
      }, 0)
      return { covered, total }
    }
    case 'lines': {
      // Jest does not emit line-level totals separately, so mirror statements
      const total = Object.keys(entry.statementMap ?? {}).length
      const covered = Object.values(entry.s ?? {}).filter((count) => count > 0).length
      return { covered, total }
    }
    default:
      return { covered: 0, total: 0 }
  }
}

function aggregateTotals(map: CoverageMap): MetricTotals {
  const totals: MetricTotals = {
    statements: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    lines: { covered: 0, total: 0 },
  }

  Object.values(map).forEach((entry) => {
    metrics.forEach((metric) => {
      const { covered, total } = collectEntryCoverage(entry, metric)
      totals[metric].covered += covered
      totals[metric].total += total
    })
  })

  return totals
}

function printSummary(totals: MetricTotals): void {
  console.log('\nGlobal Coverage Summary')
  metrics.forEach((metric) => {
    const { covered, total } = totals[metric]
    console.log(`- ${metric}: ${formatPercent(covered, total)} (${covered}/${total})`)
  })
}

function loadCoverage(): CoverageMap {
  if (!fs.existsSync(COVERAGE_FILE)) {
    console.error(`Coverage file not found: ${COVERAGE_FILE}`)
    process.exit(1)
  }

  const raw = fs.readFileSync(COVERAGE_FILE, 'utf8')
  return JSON.parse(raw) as CoverageMap
}

function loadGuards(): CoverageGuard[] {
  const resolved = path.resolve(process.cwd(), GUARD_CONFIG)
  if (!fs.existsSync(resolved)) {
    return []
  }

  try {
    const raw = fs.readFileSync(resolved, 'utf8')
    const guards = JSON.parse(raw) as CoverageGuard[]
    return Array.isArray(guards) ? guards : []
  } catch (error) {
    console.warn(`Unable to parse guard config at ${resolved}:`, error)
    return []
  }
}

function evaluateGuards(map: CoverageMap, guards: CoverageGuard[]): number {
  if (!guards.length) {
    console.log('\nNo coverage guards configured.')
    return 0
  }

  const entriesByPath = new Map<string, CoverageEntry>()
  Object.values(map).forEach((entry) => {
    const relative = normalizePath(path.relative(process.cwd(), entry.path))
    entriesByPath.set(relative, entry)
  })

  console.log('\nGuarded Files')
  let failures = 0
  guards
    .filter((guard) => guard.enabled !== false)
    .forEach((guard) => {
      const entry = entriesByPath.get(normalizePath(guard.file))

      if (!entry) {
        console.warn(`- ${guard.file}: not present in coverage data`)
        return
      }

      const statuses = metrics
        .filter((metric) => typeof guard[metric] === 'number')
        .map((metric) => {
          const { covered, total } = collectEntryCoverage(entry, metric)
          const percent = total === 0 ? 0 : (covered / total) * 100
          const target = guard[metric] as number
          const pass = percent >= target
          if (!pass && (guard.severity ?? 'error') === 'error') {
            failures += 1
          }
          const icon = pass ? '✅' : (guard.severity ?? 'error') === 'warn' ? '⚠️' : '❌'
          return `${icon} ${metric}: ${percent.toFixed(2)}% (target ${target}%)`
        })

      if (!statuses.length) {
        console.log(`- ${guard.file}: no metric thresholds specified`)
        return
      }

      console.log(`- ${guard.file}:\n    ${statuses.join('\n    ')}`)
    })

  return failures
}

function main() {
  const coverageMap = loadCoverage()
  const totals = aggregateTotals(coverageMap)
  printSummary(totals)

  const guards = loadGuards()
  const failures = evaluateGuards(coverageMap, guards)

  if (failures > 0) {
    console.error(`\nCoverage guard failures: ${failures}`)
    process.exit(1)
  }
}

main()
