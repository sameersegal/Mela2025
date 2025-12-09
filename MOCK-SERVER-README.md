# Mock Server for Local Testing

A simple Node.js-based mock server for testing the Mela 2025 frontend locally without requiring the Google Apps Script backend.

## Features

- ✅ **Zero external dependencies** - uses only Node.js built-in modules
- ✅ **Multiple test scenarios** - valid, invalid, and already-used tickets
- ✅ **CORS enabled** - works with local HTML files
- ✅ **Session tracking** - simulates "used" ticket behavior
- ✅ **Console logging** - see all requests in real-time
- ✅ **Info page** - built-in documentation at the root endpoint

## Prerequisites

- Node.js (v12 or higher)

## Quick Start

### 1. Start the Mock Server

```bash
node mock-server.js
```

The server will start on port 3000 by default. You can specify a custom port:

```bash
node mock-server.js 8080
```

### 2. Configure the Frontend

Create or update `config.js` in the project root:

```javascript
const API_URL = "http://localhost:3000";
```

### 3. Open the Frontend

Open `index.html` in a web browser. You can:
- Use a simple HTTP server: `python -m http.server 8000` or `npx http-server`
- Or just open the file directly in your browser (file://)

### 4. Test with Sample Tickets

Use the manual entry feature in the frontend (or scan QR codes if you generate them):

## Test Scenarios

### ✓ Valid Tickets (Show Full Details)

These tickets will return complete attendee information on first scan:

| Ticket ID | Name | Type | People | Transport |
|-----------|------|------|--------|-----------|
| `MELA25-VALID1` | John Doe | Student | 2 | Own Transport |
| `MELA25-VALID2` | Jane Smith | Teacher | 1 | Bus |
| `MELA25-ABC12` | Alice Johnson | Parent | 3 | Own Transport |
| `MELA25-XYZ99` | Bob Williams | Guest | 1 | Bus |

**Note:** After scanning once, these tickets become "ALREADY_USED" for the session.

### ⚠ Already Used Tickets (Pre-configured)

These tickets always return "ALREADY_USED" status:

- `MELA25-USED1`
- `MELA25-USED2`
- `MELA25-OLD99`

### ✖ Invalid Tickets

Any ticket ID not in the mock data will return "INVALID":

- `MELA25-XXXXX` (any random code)
- `MELA25-12345`
- `INVALID-TEST`

## Usage Examples

### Manual Entry (Frontend)

1. In the frontend app, type just the code part (without `MELA25-` prefix):
   - Enter: `VALID1` → Full ticket details
   - Enter: `USED1` → Already used message
   - Enter: `XXXXX` → Invalid ticket message

### Testing Flow

**Scenario 1: Valid First-Time Scan**
```
1. Enter: VALID1
2. Result: ✓ VALID TICKET with details
3. Click "Scan Next Ticket"
4. Enter: VALID1 again
5. Result: ⚠ ALREADY USED
```

**Scenario 2: Pre-Used Ticket**
```
1. Enter: USED1
2. Result: ⚠ ALREADY USED (always)
```

**Scenario 3: Invalid Ticket**
```
1. Enter: FAKE99
2. Result: ✖ INVALID TICKET
```

## API Details

### Endpoint

```
POST http://localhost:3000/
```

### Request Body

```json
{
  "ticketId": "MELA25-VALID1"
}
```

### Response Examples

**Valid Ticket (First Scan):**
```json
{
  "result": "VALID",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "iAm": "Student",
  "numberOfPeople": 2,
  "transport": "Own Transport",
  "ticketId": "MELA25-VALID1",
  "entryStatus": "valid",
  "mailerStatus": "SENT"
}
```

**Already Used Ticket:**
```json
{
  "result": "ALREADY_USED"
}
```

**Invalid Ticket:**
```json
{
  "result": "INVALID"
}
```

## Viewing Server Info

Open `http://localhost:3000/` in a browser to see:
- Server status
- API endpoint
- Complete list of test tickets
- Usage instructions

## Server Logs

The mock server logs all validation requests:

```
[2025-12-09T10:00:00.000Z] Validating ticket: MELA25-VALID1
  → Result: VALID
[2025-12-09T10:00:05.000Z] Validating ticket: MELA25-VALID1
  → Result: ALREADY_USED (scanned in session)
[2025-12-09T10:00:10.000Z] Validating ticket: MELA25-FAKE99
  → Result: INVALID
```

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:
1. Make sure the mock server is running
2. Check that `config.js` points to the correct URL
3. Try using an HTTP server instead of `file://` protocol

### Port Already in Use

If port 3000 is taken:
```bash
node mock-server.js 3001
```
Then update `config.js` to match:
```javascript
const API_URL = "http://localhost:3001";
```

### Frontend Not Connecting

1. Open browser developer tools (F12)
2. Check the Console tab for errors
3. Check the Network tab for failed requests
4. Verify `config.js` exists and has the correct API_URL

## Resetting Server State

To reset which tickets are marked as "used":
1. Stop the server (Ctrl+C)
2. Start it again

This clears the session tracking and allows valid tickets to be scanned again.

## Adding Custom Test Data

To add more test tickets, edit `mock-server.js` and add entries to the `MOCK_TICKETS` object:

```javascript
const MOCK_TICKETS = {
  'MELA25-CUSTOM1': {
    result: 'VALID',
    name: 'Your Name',
    email: 'your.email@example.com',
    iAm: 'Student',
    numberOfPeople: 1,
    transport: 'Own Transport',
    ticketId: 'MELA25-CUSTOM1',
    entryStatus: 'valid',
    mailerStatus: 'SENT'
  },
  // ... more tickets
};
```

## Production vs. Mock Server

| Feature | Mock Server | Production (Apps Script) |
|---------|-------------|--------------------------|
| Purpose | Local testing | Live event validation |
| Data | Hardcoded mock data | Google Sheet database |
| Persistence | Session only | Permanent in Sheet |
| Deployment | Local machine | Google Cloud |
| Dependencies | None | Google Apps Script |

## Next Steps

Once you've tested locally:
1. Update `config.js` with the production Apps Script URL
2. Deploy to Netlify or your hosting platform
3. Test with real QR codes from the Google Form system

## Support

For issues with the mock server:
- Check Node.js is installed: `node --version`
- Verify the server is running: Visit `http://localhost:3000/`
- Check browser console for errors
- Review server console logs for request details
