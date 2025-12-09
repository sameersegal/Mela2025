# Mock Server for Local Testing

A simple Node.js mock server for testing the Mela 2025 frontend locally without the Google Apps Script backend.

## Features

- Zero external dependencies (uses only Node.js built-in modules)
- Multiple test scenarios: valid, invalid, and already-used tickets
- CORS enabled for local testing
- Session tracking to simulate "used" ticket behavior
- Built-in info page with test ticket documentation

## Quick Start

### 1. Start the Mock Server

```bash
node mock-server.js
```

The server starts on port 3000 by default. For a different port:

```bash
node mock-server.js 8080
```

### 2. Open the Frontend

Open `index.html` in your browser. The default `config.js` already points to `http://localhost:3000`.

You can:
- Use a simple HTTP server: `python -m http.server 8000`
- Or open the file directly in your browser

**For production:** Update `config.js` with your Google Apps Script URL, or use the build script which generates it from `.env`.

### 3. Test with Sample Tickets

In the frontend manual entry, type just the code part (without `MELA25-` prefix):
- `VALID1` → Full ticket details
- `USED1` → Already used message  
- `XXXXX` → Invalid ticket message

## Test Tickets

### Valid Tickets (show full details on first scan)

| Code | Name | Type | People | Transport |
|------|------|------|--------|-----------|
| `MELA25-VALID1` | John Doe | Student | 2 | Own Transport |
| `MELA25-VALID2` | Jane Smith | Teacher | 1 | Bus |
| `MELA25-ABC12` | Alice Johnson | Parent | 3 | Own Transport |
| `MELA25-XYZ99` | Bob Williams | Guest | 1 | Bus |

**Note:** After first scan, these become "ALREADY_USED" for the session.

### Already Used Tickets (always return ALREADY_USED)

- `MELA25-USED1`
- `MELA25-USED2`
- `MELA25-OLD99`

### Invalid Tickets

Any other ticket ID (e.g., `MELA25-XXXXX`) returns "INVALID"

## API Endpoint

**POST** `http://localhost:3000/`

**Request:**
```json
{
  "ticketId": "MELA25-VALID1"
}
```

**Response (Valid):**
```json
{
  "result": "VALID",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "iAm": "Student",
  "numberOfPeople": 2,
  "transport": "Own Transport",
  "ticketId": "MELA25-VALID1"
}
```

**Response (Already Used):**
```json
{
  "result": "ALREADY_USED"
}
```

**Response (Invalid):**
```json
{
  "result": "INVALID"
}
```

## Server Info Page

Visit `http://localhost:3000/` in your browser to see the complete list of test tickets and usage documentation.

## Troubleshooting

**Port already in use?**
```bash
node mock-server.js 3001
```
Then update `config.js` to `http://localhost:3001`

**Frontend not connecting?**
- Ensure mock server is running
- Check `config.js` has correct URL
- Open browser DevTools to check console/network errors

**Reset "used" tickets?**
- Stop server (Ctrl+C) and restart it

## Moving to Production

1. Update `config.js` with your production Apps Script URL
2. Deploy to Netlify or your hosting platform
3. Test with real QR codes
