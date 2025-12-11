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
// Note: entryStatus, totalEntered, and entryLog are managed dynamically
const MOCK_TICKETS = {
  // Valid tickets (not yet scanned)
  'MELA25-VALID1': {
    name: 'John Doe',
    email: 'john.doe@example.com',
    iAm: 'Student',
    numberOfPeople: 2,
    transport: 'Own Transport',
    ticketId: 'MELA25-VALID1'
  },
  'MELA25-VALID2': {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    iAm: 'Teacher',
    numberOfPeople: 1,
    transport: 'Bus',
    ticketId: 'MELA25-VALID2'
  },
  'MELA25-ABC12': {
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    iAm: 'Parent',
    numberOfPeople: 3,
    transport: 'Own Transport',
    ticketId: 'MELA25-ABC12'
  },
  'MELA25-XYZ99': {
    name: 'Bob Williams',
    email: 'bob.w@example.com',
    iAm: 'Guest',
    numberOfPeople: 5,  // Large group for testing split entry
    transport: 'Bus',
    ticketId: 'MELA25-XYZ99'
  },

  // Pre-configured partial ticket (some people already entered)
  'MELA25-PART1': {
    name: 'Partial Family',
    email: 'partial@example.com',
    iAm: 'Parent',
    numberOfPeople: 4,
    transport: 'Own Transport',
    ticketId: 'MELA25-PART1'
  },

  // Pre-configured used tickets (all people entered)
  'MELA25-USED1': {
    name: 'Sarah Brown',
    email: 'sarah.b@example.com',
    iAm: 'Student',
    numberOfPeople: 1,
    transport: 'Own Transport',
    ticketId: 'MELA25-USED1'
  },
  'MELA25-USED2': {
    name: 'Michael Chen',
    email: 'michael.c@example.com',
    iAm: 'Teacher',
    numberOfPeople: 2,
    transport: 'Bus',
    ticketId: 'MELA25-USED2'
  },
  'MELA25-OLD99': {
    name: 'Emma Wilson',
    email: 'emma.w@example.com',
    iAm: 'Parent',
    numberOfPeople: 4,
    transport: 'Own Transport',
    ticketId: 'MELA25-OLD99'
  }
};

// Track ticket state: { totalEntered, entryStatus, entryLog }
const ticketState = {
  // Pre-configure some tickets as partial or used
  'MELA25-PART1': {
    totalEntered: 2,
    entryStatus: 'partial',
    entryLog: [{ count: 2, timestamp: '2025-12-10T10:00:00.000Z', cumulative: 2 }]
  },
  'MELA25-USED1': {
    totalEntered: 1,
    entryStatus: 'used',
    entryLog: [{ count: 1, timestamp: '2025-12-10T09:00:00.000Z', cumulative: 1 }]
  },
  'MELA25-USED2': {
    totalEntered: 2,
    entryStatus: 'used',
    entryLog: [{ count: 2, timestamp: '2025-12-10T09:30:00.000Z', cumulative: 2 }]
  },
  'MELA25-OLD99': {
    totalEntered: 4,
    entryStatus: 'used',
    entryLog: [{ count: 4, timestamp: '2025-12-09T14:00:00.000Z', cumulative: 4 }]
  }
};

/**
 * Get or initialize ticket state
 */
function getTicketState(ticketId) {
  if (!ticketState[ticketId]) {
    ticketState[ticketId] = {
      totalEntered: 0,
      entryStatus: 'valid',
      entryLog: []
    };
  }
  return ticketState[ticketId];
}

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
      const peopleEntering = parseInt(data.peopleEntering) || 0; // 0 means just checking status

      console.log(`[${new Date().toISOString()}] Validating ticket: ${ticketId}, peopleEntering: ${peopleEntering}`);

      // Check if ticket exists in mock data
      if (!MOCK_TICKETS[ticketId]) {
        console.log(`  → Result: INVALID`);
        sendResponse(res, 200, { result: 'INVALID' });
        return;
      }

      const ticket = MOCK_TICKETS[ticketId];
      const state = getTicketState(ticketId);
      const numberOfPeople = ticket.numberOfPeople;

      // If peopleEntering is 0, just return current status (no entry recorded)
      if (peopleEntering === 0) {
        let result = 'VALID';
        if (state.entryStatus === 'used') {
          result = 'ALREADY_USED';
        } else if (state.entryStatus === 'partial') {
          result = 'PARTIAL';
        }

        console.log(`  → Result: ${result} (status check only)`);
        const { email, ...ticketWithoutEmail } = ticket;
        sendResponse(res, 200, {
          result: result,
          ...ticketWithoutEmail,
          entryStatus: state.entryStatus,
          totalEntered: state.totalEntered,
          entryLog: state.entryLog
        });
        return;
      }

      // Record the entry
      const newTotalEntered = state.totalEntered + peopleEntering;
      const timestamp = new Date().toISOString();

      // Add to entry log
      state.entryLog.push({
        count: peopleEntering,
        timestamp: timestamp,
        cumulative: newTotalEntered
      });

      // Determine new status
      if (newTotalEntered >= numberOfPeople) {
        state.entryStatus = 'used';
      } else {
        state.entryStatus = 'partial';
      }

      state.totalEntered = newTotalEntered;

      // Determine if over capacity
      const isOverCapacity = newTotalEntered > numberOfPeople;

      console.log(`  → Result: VALID, entered: ${peopleEntering}, total: ${newTotalEntered}/${numberOfPeople}, status: ${state.entryStatus}${isOverCapacity ? ' (OVER CAPACITY)' : ''}`);

      const { email, ...ticketWithoutEmail } = ticket;
      sendResponse(res, 200, {
        result: 'VALID',
        ...ticketWithoutEmail,
        entryStatus: state.entryStatus,
        totalEntered: newTotalEntered,
        entryLog: state.entryLog,
        isOverCapacity: isOverCapacity
      });

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
  console.log('     Valid:    MELA25-VALID1 (2 ppl), MELA25-VALID2 (1), MELA25-ABC12 (3), MELA25-XYZ99 (5)');
  console.log('     Partial:  MELA25-PART1 (2 of 4 entered)');
  console.log('     Used:     MELA25-USED1, MELA25-USED2, MELA25-OLD99');
  console.log('     Invalid:  Any other code');
  console.log('');
  console.log('  📋 API Usage:');
  console.log('     POST { ticketId: "MELA25-XXX" }                    → Check status only');
  console.log('     POST { ticketId: "MELA25-XXX", peopleEntering: 2 } → Record 2 people entering');
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});
