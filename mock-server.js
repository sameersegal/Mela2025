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
    entryStatus: 'valid',
    mailerStatus: 'SENT'
  },
  'MELA25-VALID2': {
    result: 'VALID',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    iAm: 'Teacher',
    numberOfPeople: 1,
    transport: 'Bus',
    ticketId: 'MELA25-VALID2',
    entryStatus: 'valid',
    mailerStatus: 'SENT'
  },
  'MELA25-ABC12': {
    result: 'VALID',
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    iAm: 'Parent',
    numberOfPeople: 3,
    transport: 'Own Transport',
    ticketId: 'MELA25-ABC12',
    entryStatus: 'valid',
    mailerStatus: 'SENT'
  },
  'MELA25-XYZ99': {
    result: 'VALID',
    name: 'Bob Williams',
    email: 'bob.w@example.com',
    iAm: 'Guest',
    numberOfPeople: 1,
    transport: 'Bus',
    ticketId: 'MELA25-XYZ99',
    entryStatus: 'valid',
    mailerStatus: 'SENT'
  },
  
  // Already used tickets
  'MELA25-USED1': {
    result: 'ALREADY_USED'
  },
  'MELA25-USED2': {
    result: 'ALREADY_USED'
  },
  'MELA25-OLD99': {
    result: 'ALREADY_USED'
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
          sendResponse(res, 200, { result: 'ALREADY_USED' });
          return;
        }
        
        // If ticket was scanned in this session
        if (scannedTickets.has(ticketId)) {
          console.log(`  → Result: ALREADY_USED (scanned in session)`);
          sendResponse(res, 200, { result: 'ALREADY_USED' });
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
  
  // Handle GET request - show info page
  if (req.method === 'GET' && parsedUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Mela 2025 Mock Server</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #667eea; }
    h2 { color: #333; margin-top: 30px; }
    .status { 
      display: inline-block;
      padding: 5px 10px;
      border-radius: 5px;
      font-weight: bold;
      margin-left: 10px;
    }
    .status.running { background: #d4edda; color: #155724; }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
    .ticket-list {
      display: grid;
      gap: 10px;
      margin-top: 15px;
    }
    .ticket {
      background: #f8f9fa;
      padding: 10px 15px;
      border-radius: 5px;
      border-left: 4px solid #667eea;
    }
    .ticket.used {
      border-left-color: #f59e0b;
    }
    .ticket strong {
      font-family: monospace;
      color: #667eea;
    }
    .endpoint {
      background: #e7f3ff;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    ul { line-height: 1.8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎉 Mela 2025 Mock Server</h1>
    <span class="status running">✓ Running on port ${PORT}</span>
    
    <h2>📡 API Endpoint</h2>
    <div class="endpoint">
      <strong>POST</strong> <code>http://localhost:${PORT}/</code>
    </div>
    
    <h2>🎫 Test Tickets</h2>
    
    <h3>✓ Valid Tickets (will show details)</h3>
    <div class="ticket-list">
      <div class="ticket">
        <strong>MELA25-VALID1</strong> - John Doe (Student, 2 people)
      </div>
      <div class="ticket">
        <strong>MELA25-VALID2</strong> - Jane Smith (Teacher, 1 person)
      </div>
      <div class="ticket">
        <strong>MELA25-ABC12</strong> - Alice Johnson (Parent, 3 people)
      </div>
      <div class="ticket">
        <strong>MELA25-XYZ99</strong> - Bob Williams (Guest, 1 person)
      </div>
    </div>
    
    <h3>⚠ Already Used Tickets (pre-configured)</h3>
    <div class="ticket-list">
      <div class="ticket used">
        <strong>MELA25-USED1</strong> - Will always return ALREADY_USED
      </div>
      <div class="ticket used">
        <strong>MELA25-USED2</strong> - Will always return ALREADY_USED
      </div>
      <div class="ticket used">
        <strong>MELA25-OLD99</strong> - Will always return ALREADY_USED
      </div>
    </div>
    
    <h3>✖ Invalid Tickets (not in system)</h3>
    <div class="ticket-list">
      <div class="ticket">
        Any ticket ID not listed above will return <strong>INVALID</strong>
      </div>
    </div>
    
    <h2>🔄 Usage</h2>
    <ul>
      <li>Update <code>config.js</code> to point to <code>http://localhost:${PORT}</code></li>
      <li>Open <code>index.html</code> in a browser</li>
      <li>Scan or manually enter test ticket codes</li>
      <li>Valid tickets become "used" after first scan in this session</li>
      <li>Restart server to reset "used" tickets</li>
    </ul>
    
    <h2>📝 Notes</h2>
    <ul>
      <li>Server logs all requests to console</li>
      <li>CORS is enabled for all origins</li>
      <li>No external dependencies required</li>
      <li>Session state resets on server restart</li>
    </ul>
  </div>
</body>
</html>
    `);
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
  console.log(`  📡 API Endpoint:  http://localhost:${PORT}/`);
  console.log(`  📖 Info Page:     http://localhost:${PORT}/`);
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
