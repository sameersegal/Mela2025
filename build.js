#!/usr/bin/env node

/**
 * Build script for Netlify deployment
 * Generates config.js from environment variables
 */

const fs = require('fs');
const path = require('path');

console.log('📝 Generating config.js from environment variables...');

// Get API_URL from environment variable
const apiUrl = process.env.API_URL;

if (!apiUrl) {
  console.error('❌ Error: API_URL environment variable not found!');
  console.error('Please set API_URL in Netlify environment variables.');
  process.exit(1);
}

// Generate config.js content
const configContent = `const API_URL = "${apiUrl}";\n`;

// Write config.js
const configPath = path.join(__dirname, 'config.js');
fs.writeFileSync(configPath, configContent, 'utf8');

console.log('✅ Generated config.js successfully!');
console.log(`   API_URL: ${apiUrl}`);
