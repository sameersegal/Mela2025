# Mock Server for Local Testing

A simple Node.js mock server for testing the Mela 2025 frontend locally without the Google Apps Script backend.

## Features

- Zero external dependencies (uses only Node.js built-in modules)
- Serves the frontend HTML page directly
- Multiple test scenarios: valid, partial, used, and invalid tickets
- **Flexible entry tracking**: supports partial entry, split arrivals, and excess entry
- CORS enabled for local testing
- Session tracking to simulate entry state persistence

## Quick Start

### 1. Start the Mock Server

```bash
npm run dev    # With auto-reload (recommended)
# or
node mock-server.js
```

The server starts on port 3000 by default. For a different port:

```bash
node mock-server.js 8080
```

### 2. Open the Frontend

Open your browser and navigate to `http://localhost:3000/`

The mock server serves the `index.html` page directly - no need for a separate HTTP server!

**For production:** Update `config.js` with your Google Apps Script URL, or use the build script which generates it from `.env`.

### 3. Test with Sample Tickets

In the frontend manual entry, type just the code part (without `MELA25-` prefix):
- `VALID1` → New ticket for 2 people
- `XYZ99` → Large group (5 people) - good for testing split entry
- `PART1` → Partially used (2 of 4 entered)
- `USED1` → Fully used ticket
- `XXXXX` → Invalid ticket message

## Test Tickets

### Valid Tickets (not yet scanned)

| Code | Name | Type | Registered | Transport |
|------|------|------|------------|-----------|
| `MELA25-VALID1` | John Doe | Student | 2 | Own Transport |
| `MELA25-VALID2` | Jane Smith | Teacher | 1 | Bus |
| `MELA25-ABC12` | Alice Johnson | Parent | 3 | Own Transport |
| `MELA25-XYZ99` | Bob Williams | Guest | 5 | Bus |

### Partial Ticket (some people already entered)

| Code | Name | Registered | Already Entered | Remaining |
|------|------|------------|-----------------|-----------|
| `MELA25-PART1` | Partial Family | 4 | 2 | 2 |

### Fully Used Tickets (all registered people entered)

| Code | Name | Registered | Entered |
|------|------|------------|---------|
| `MELA25-USED1` | Sarah Brown | 1 | 1 |
| `MELA25-USED2` | Michael Chen | 2 | 2 |
| `MELA25-OLD99` | Emma Wilson | 4 | 4 |

### Invalid Tickets

Any other ticket ID (e.g., `MELA25-XXXXX`) returns "INVALID"

## Test Scenarios

### Scenario 1: Partial Entry (Less than registered)
1. Scan `MELA25-VALID1` (registered for 2 people)
2. Enter `1` as people entering
3. Result: Ticket becomes "partial" with 1/2 entered
4. Scan again: Shows 1 already entered, allows entering more

### Scenario 2: Split Entry (Arriving in batches)
1. Scan `MELA25-XYZ99` (registered for 5 people)
2. Enter `3` as people entering → Status: "partial" (3/5)
3. Scan again, enter `2` more → Status: "used" (5/5)
4. Entry log shows both batches with timestamps

### Scenario 3: Excess Entry (More than registered)
1. Scan `MELA25-VALID2` (registered for 1 person)
2. Enter `3` as people entering
3. Warning displayed: "This exceeds the registered count!"
4. Confirm anyway → Entry recorded with over-capacity flag

### Scenario 4: Re-entry after full use
1. Scan `MELA25-USED1` (already fully used)
2. UI shows "Fully Used" banner with entry history
3. Can still enter more people (with warning)

## API Endpoint

**POST** `http://localhost:3000/`

### Check Status Only (no entry recorded)

**Request:**
```json
{
  "ticketId": "MELA25-VALID1",
  "peopleEntering": 0
}
```

**Response:**
```json
{
  "result": "VALID",
  "name": "John Doe",
  "iAm": "Student",
  "numberOfPeople": 2,
  "transport": "Own Transport",
  "ticketId": "MELA25-VALID1",
  "entryStatus": "valid",
  "totalEntered": 0,
  "entryLog": []
}
```

### Record Entry

**Request:**
```json
{
  "ticketId": "MELA25-VALID1",
  "peopleEntering": 2
}
```

**Response:**
```json
{
  "result": "VALID",
  "name": "John Doe",
  "iAm": "Student",
  "numberOfPeople": 2,
  "transport": "Own Transport",
  "ticketId": "MELA25-VALID1",
  "entryStatus": "used",
  "totalEntered": 2,
  "entryLog": [
    { "count": 2, "timestamp": "2025-12-11T10:30:00.000Z", "cumulative": 2 }
  ],
  "isOverCapacity": false
}
```

### Response Types

| Result | Meaning |
|--------|---------|
| `VALID` | Entry recorded successfully |
| `PARTIAL` | Status check - some people already entered |
| `ALREADY_USED` | Status check - all registered people entered |
| `INVALID` | Ticket not found |

### Entry Status Values

| Status | Meaning |
|--------|---------|
| `valid` | No entries recorded yet |
| `partial` | Some entries, but `totalEntered < numberOfPeople` |
| `used` | `totalEntered >= numberOfPeople` |

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

**Reset ticket states?**
- Stop server (Ctrl+C) and restart it
- All tickets reset to their initial states

## Moving to Production

1. Update `config.js` with your production Apps Script URL
2. Deploy to Netlify or your hosting platform
3. Test with real QR codes

**Note:** Remember to add columns J (Total Entered) and K (Entry Log) to your Google Sheet!
