// Small runner to avoid shell quoting issues when running the TypeScript seed
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
require('./prisma/seed.ts');
