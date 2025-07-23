#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Get version from command line argument
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Usage: node scripts/release.js <version>');
  console.error('Example: node scripts/release.js 1.2.3');
  process.exit(1);
}

// Validate version format
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('Version must be in format: x.y.z');
  process.exit(1);
}

try {
  // Read package.json
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Update version
  const oldVersion = packageJson.version;
  packageJson.version = newVersion;
  
  // Write back to package.json
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  
  console.log(`✅ Updated version from ${oldVersion} to ${newVersion}`);
  
  // Commit changes
  execSync('git add package.json', { stdio: 'inherit' });
  execSync(`git commit -m "Bump version to ${newVersion}"`, { stdio: 'inherit' });
  
  // Create and push tag
  execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });
  
  console.log(`🎉 Successfully released version ${newVersion}!`);
  console.log('GitHub Actions will automatically build and publish the release.');
  
} catch (error) {
  console.error('❌ Error during release:', error.message);
  process.exit(1);
} 