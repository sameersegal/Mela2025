#!/usr/bin/env node

/**
 * Simple Mock Server for Mela 2025 Local Testing
 * 
 * This mock server simulates the Google Apps Script backend for local development.
 * No external dependencies required - uses only Node.js built-in modules.
 * 
 * Usage:
 *   node mock-server.js [port]
 * 
 * Default port: 3000
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || 3000;

// Mock data for different ticket scenarios
const MOCK_TICKETS = {
  // Valid tickets
  'MELA25-VALID1': {
    result: 'VALID',
    name: 'John Doe',
    email: 'john.doe@example.com',
    iAm: 'Student',
    numberOfPeople: 2,
    transport: 'Own Transport',
    ticketId: 'MELA25-VALID1',
    entryStatus: 'valid'
  },
  'MELA25-VALID2': {
    result: 'VALID',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    iAm: 'Teacher',
    numberOfPeople: 1,
    transport: 'Bus',
    ticketId: 'MELA25-VALID2',
    entryStatus: 'valid'
  },
  'MELA25-ABC12': {
    result: 'VALID',
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    iAm: 'Parent',
    numberOfPeople: 3,
    transport: 'Own Transport',
    ticketId: 'MELA25-ABC12',
    entryStatus: 'valid'
  },
  'MELA25-XYZ99': {
    result: 'VALID',
    name: 'Bob Williams',
    email: 'bob.w@example.com',
    iAm: 'Guest',
    numberOfPeople: 1,
    transport: 'Bus',
    ticketId: 'MELA25-XYZ99',
    entryStatus: 'valid'
  },
  
  // Already used tickets - include full details
  'MELA25-USED1': {
    result: 'ALREADY_USED',
    name: 'Sarah Brown',
    email: 'sarah.b@example.com',
    iAm: 'Student',
    numberOfPeople: 1,
    transport: 'Own Transport',
    ticketId: 'MELA25-USED1',
    entryStatus: 'used'
  },
  'MELA25-USED2': {
    result: 'ALREADY_USED',
    name: 'Michael Chen',
    email: 'michael.c@example.com',
    iAm: 'Teacher',
    numberOfPeople: 2,
    transport: 'Bus',
    ticketId: 'MELA25-USED2',
    entryStatus: 'used'
  },
  'MELA25-OLD99': {
    result: 'ALREADY_USED',
    name: 'Emma Wilson',
    email: 'emma.w@example.com',
    iAm: 'Parent',
    numberOfPeople: 4,
    transport: 'Own Transport',
    ticketId: 'MELA25-OLD99',
    entryStatus: 'used'
  }
};

// Track which tickets have been scanned (becomes "used" after first scan)
const scannedTickets = new Set();

/**
 * Handle POST requests for ticket validation
 */
function handleTicketValidation(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const ticketId = data.ticketId;
      
      console.log(`[${new Date().toISOString()}] Validating ticket: ${ticketId}`);
      
      // Check if ticket exists in mock data
      if (MOCK_TICKETS[ticketId]) {
        const ticket = MOCK_TICKETS[ticketId];
        
        // If ticket is already marked as ALREADY_USED in mock data
        if (ticket.result === 'ALREADY_USED') {
          console.log(`  → Result: ALREADY_USED (pre-configured)`);
          sendResponse(res, 200, ticket);
          return;
        }
        
        // If ticket was scanned in this session
        if (scannedTickets.has(ticketId)) {
          console.log(`  → Result: ALREADY_USED (scanned in session)`);
          // Return full ticket details with ALREADY_USED status
          sendResponse(res, 200, { ...ticket, result: 'ALREADY_USED' });
          return;
        }
        
        // Valid ticket - mark as scanned and return details
        scannedTickets.add(ticketId);
        console.log(`  → Result: VALID`);
        sendResponse(res, 200, ticket);
        return;
      }
      
      // Ticket not found - invalid
      console.log(`  → Result: INVALID`);
      sendResponse(res, 200, { result: 'INVALID' });
      
    } catch (error) {
      console.error(`Error parsing request: ${error.message}`);
      sendResponse(res, 400, { result: 'ERROR', message: 'Invalid request format' });
    }
  });
}

/**
 * Send JSON response with CORS headers
 */
function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

/**
 * Main request handler
 */
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    sendResponse(res, 200, {});
    return;
  }
  
  // Handle POST request for ticket validation
  if (req.method === 'POST' && parsedUrl.pathname === '/') {
    handleTicketValidation(req, res);
    return;
  }
  
  // Handle GET request for root - serve index.html
  if (req.method === 'GET' && parsedUrl.pathname === '/') {
    const indexPath = path.join(__dirname, 'index.html');
    fs.readFile(indexPath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading index.html');
        console.error('Error reading index.html:', err);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }
  
  // Handle GET request for config.js
  if (req.method === 'GET' && parsedUrl.pathname === '/config.js') {
    const configPath = path.join(__dirname, 'config.js');
    fs.readFile(configPath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading config.js');
        console.error('Error reading config.js:', err);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(data);
    });
    return;
  }
  
  // 404 for other paths
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Start the server
server.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║     🎉 Mela 2025 Mock Server - Running!            ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  🌐 Frontend:      http://localhost:${PORT}/`);
  console.log(`  📡 API Endpoint:  POST http://localhost:${PORT}/`);
  console.log('');
  console.log('  🎫 Test Tickets:');
  console.log('     Valid:   MELA25-VALID1, MELA25-VALID2, MELA25-ABC12, MELA25-XYZ99');
  console.log('     Used:    MELA25-USED1, MELA25-USED2, MELA25-OLD99');
  console.log('     Invalid: Any other code');
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});
