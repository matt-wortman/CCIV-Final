#!/usr/bin/env tsx

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';

interface Options {
  workflow?: string;
  runId?: string;
  date?: string;
  outputDir?: string;
  coverageSummary?: string;
  coverageFinal?: string;
  guards?: string;
  dryRun?: boolean;
  skipDownload?: boolean;
}

const args = process.argv.slice(2);
const options: Options = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (!arg.startsWith('--')) {
    continue;
  }

  const next = () => {
    const value = args[++i];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${arg}`);
    }
    return value;
  };

  switch (arg) {
    case '--workflow':
      options.workflow = next();
      break;
    case '--run':
      options.runId = next();
      break;
    case '--date':
      options.date = next();
      break;
    case '--output':
      options.outputDir = next();
      break;
    case '--coverage-summary':
      options.coverageSummary = next();
      break;
    case '--coverage-final':
      options.coverageFinal = next();
      break;
    case '--guards':
      options.guards = next();
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--skip-download':
      options.skipDownload = true;
      break;
    case '--help':
      printHelp();
      process.exit(0);
    default:
      throw new Error(`Unknown argument: ${arg}`);
  }
}

if (!options.workflow) {
  throw new Error('Missing required argument: --workflow');
}

if (!options.runId && !options.dryRun) {
  throw new Error('Missing required argument: --run (unless --dry-run is set)');
}

const today = new Date().toISOString().slice(0, 10);
const baseDir = path.resolve(
  options.outputDir ?? path.join('docs', 'evidence', options.date ?? today, options.workflow)
);

mkdirSync(baseDir, { recursive: true });
const artifactsDir = path.join(baseDir, 'artifacts');

const metadataPath = path.join(baseDir, 'metadata.json');
const logsPath = path.join(baseDir, 'logs.txt');

const runGh = (ghArgs: string[], description: string) => {
  if (options.dryRun) {
    console.log(`[dry-run] gh ${ghArgs.join(' ')} (${description})`);
    return '';
  }

  try {
    return execFileSync('gh', ghArgs, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Failed to execute gh ${ghArgs.join(' ')}`);
    throw error;
  }
};

const ensureFile = (source: string | undefined, targetName: string) => {
  if (!source) {
    return;
  }

  const resolved = path.resolve(source);
  if (!existsSync(resolved)) {
    throw new Error(`Cannot copy ${targetName}; source not found at ${resolved}`);
  }

  copyFileSync(resolved, path.join(baseDir, targetName));
};

if (options.dryRun) {
  console.log(`📄 Dry run: creating placeholder metadata/logs in ${baseDir}`);
  writeFileSync(metadataPath, JSON.stringify({ note: 'dry-run placeholder', workflow: options.workflow }, null, 2));
  writeFileSync(logsPath, 'dry-run: no logs captured');
} else {
  const metadataFields = [
    'name',
    'runNumber',
    'runAttempt',
    'databaseId',
    'workflowName',
    'displayTitle',
    'headSha',
    'headBranch',
    'url',
    'status',
    'conclusion',
    'createdAt',
    'updatedAt',
    'startedAt',
    'completedAt',
    'event',
    'actor',
  ];
  const metadata = runGh(['run', 'view', options.runId!, '--json', metadataFields.join(',')], 'metadata');
  writeFileSync(metadataPath, metadata);

  const logs = runGh(['run', 'view', options.runId!, '--log'], 'logs');
  writeFileSync(logsPath, logs);
}

if (!options.skipDownload) {
  if (options.dryRun) {
    console.log(`[dry-run] gh run download ${options.runId ?? '<run-id>'} --dir ${artifactsDir}`);
    mkdirSync(artifactsDir, { recursive: true });
  } else {
    mkdirSync(artifactsDir, { recursive: true });
    runGh(['run', 'download', options.runId!, '--dir', artifactsDir], 'download artifacts');
  }
}

ensureFile(options.coverageSummary, 'coverage-summary.json');
ensureFile(options.coverageFinal, 'coverage-final.json');
ensureFile(options.guards, 'guards.json');

generateIntegrity(baseDir);

console.log(`✅ Evidence captured in ${baseDir}`);

function generateIntegrity(rootDir: string) {
  const entries: Array<{ path: string; hash: string }> = [];

  const walk = (current: string) => {
    const dirents = readdirSync(current, { withFileTypes: true });
    for (const dirent of dirents) {
      const absolute = path.join(current, dirent.name);
      const relative = path.relative(rootDir, absolute);
      if (relative === 'INTEGRITY.md5') {
        continue;
      }
      if (dirent.isDirectory()) {
        walk(absolute);
      } else {
        const hash = createHash('md5').update(readFileSync(absolute)).digest('hex');
        entries.push({ path: relative, hash });
      }
    }
  };

  walk(rootDir);
  entries.sort((a, b) => a.path.localeCompare(b.path));

  const lines = entries.map((entry) => `${entry.hash}  ${entry.path}`);
  writeFileSync(path.join(rootDir, 'INTEGRITY.md5'), lines.join('\n') + '\n');
}

function printHelp() {
  console.log(`Usage: tsx scripts/collect-evidence.ts --workflow <name> --run <id> [options]\n\nOptions:\n  --workflow <name>         Workflow folder name (e.g., ci, nightly)\n  --run <id>                GitHub Actions run ID\n  --date <YYYY-MM-DD>      Destination date (defaults to today)\n  --output <path>          Override output directory\n  --coverage-summary <path> Copy an existing coverage summary JSON into the evidence folder\n  --coverage-final <path>   Copy raw coverage-final JSON into the evidence folder\n  --guards <path>          Copy coverage guard configuration snapshot\n  --skip-download          Skip artifact download step\n  --dry-run                Print actions without invoking gh / copying files\n  --help                   Show this message`);
}
