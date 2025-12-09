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

// Validate API URL format
try {
  const url = new URL(apiUrl);
  if (!url.protocol.startsWith('http')) {
    throw new Error('URL must use HTTP or HTTPS protocol');
  }
} catch (error) {
  console.error('❌ Error: Invalid API_URL format!');
  console.error(`   ${error.message}`);
  console.error('   Expected format: https://script.google.com/macros/s/YOUR_ID/exec');
  process.exit(1);
}

// Escape special characters to prevent code injection
const escapedApiUrl = apiUrl
  .replace(/\\/g, '\\\\')  // Escape backslashes
  .replace(/"/g, '\\"')    // Escape double quotes
  .replace(/\n/g, '\\n')   // Escape newlines
  .replace(/\r/g, '\\r');  // Escape carriage returns

// Generate config.js content
const configContent = `const API_URL = "${escapedApiUrl}";\n`;

// Write config.js
const configPath = path.join(__dirname, 'config.js');
fs.writeFileSync(configPath, configContent, 'utf8');

console.log('✅ Generated config.js successfully!');
console.log(`   API_URL: ${apiUrl}`);
