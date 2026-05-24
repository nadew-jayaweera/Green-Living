const fs = require('fs');
const { execSync } = require('child_process');

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex === -1) continue;

        const key = trimmed.slice(0, equalsIndex).trim();
        const rawValue = trimmed.slice(equalsIndex + 1).trim();
        if (!key || process.env[key]) continue;

        const value = rawValue.replace(/^"|"$/g, '');
        process.env[key] = value;
    }
}

loadEnvFile('.env.production.local');
loadEnvFile('.env');

process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    '';

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is missing and no fallback Postgres URL was found.');
    process.exit(1);
}

const commands = [
    'npx prisma generate',
    'next build',
];

for (const command of commands) {
    execSync(command, { stdio: 'inherit', env: process.env });
}
