#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get package name from command line args
const packageName = process.argv[2];

if (!packageName) {
  console.error('Usage: npm run new-package <package-name>');
  process.exit(1);
}

const packageDir = path.join('packages', packageName);

// Check if package already exists
if (fs.existsSync(packageDir)) {
  console.error(`Package ${packageName} already exists!`);
  process.exit(1);
}

// Create package directory
fs.mkdirSync(packageDir, { recursive: true });
fs.mkdirSync(path.join(packageDir, 'src'), { recursive: true });

// Create package.json
const packageJson = {
  name: `@lukeus/${packageName}`,
  version: '1.0.0',
  description: `${packageName} package for Lukeus Music Lab`,
  main: 'dist/index.js',
  types: 'dist/index.d.ts',
  scripts: {
    build: 'tsc',
    dev: 'tsc --watch',
    clean: 'rm -rf dist'
  },
  keywords: ['music', 'audio', packageName],
  author: 'Lukeus',
  license: 'MIT',
  devDependencies: {
    typescript: '^5.0.0'
  },
  files: ['dist']
};

fs.writeFileSync(
  path.join(packageDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Create basic TypeScript file
const indexTs = `// ${packageName} package
export * from './${packageName}';
`;

const mainTs = `// Main ${packageName} functionality
export function hello${packageName.charAt(0).toUpperCase() + packageName.slice(1)}() {
  return \`Hello from @lukeus/${packageName}!\`;
}
`;

fs.writeFileSync(path.join(packageDir, 'src', 'index.ts'), indexTs);
fs.writeFileSync(path.join(packageDir, 'src', `${packageName}.ts`), mainTs);

// Create tsconfig.json
const tsConfig = {
  extends: '../../configs/tsconfig/base.json',
  compilerOptions: {
    outDir: 'dist',
    rootDir: 'src'
  },
  include: ['src/**/*'],
  exclude: ['node_modules', 'dist']
};

fs.writeFileSync(
  path.join(packageDir, 'tsconfig.json'),
  JSON.stringify(tsConfig, null, 2)
);

console.log(`✅ Created new package: @lukeus/${packageName}`);
console.log(`📁 Location: ${packageDir}`);
console.log(`🚀 Run: npm install && npm run build --workspace=packages/${packageName}`);
