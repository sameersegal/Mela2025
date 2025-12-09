# Quick Start Guide - Mock Server

This is a 2-minute guide to get the mock server running for local testing.

## Step 1: Start the Mock Server

```bash
node mock-server.js
```

You should see:
```
╔═══════════════════════════════════════════════════════╗
║     🎉 Mela 2025 Mock Server - Running!            ║
╚═══════════════════════════════════════════════════════╝

  📡 API Endpoint:  http://localhost:3000/
  📖 Info Page:     http://localhost:3000/
```

## Step 2: Test the Frontend

### Option A: Use the Test Page

Open `test-mock-server.html` in your browser and click the test buttons.

### Option B: Use the Main Frontend

1. Temporarily update `index.html` line 241:
   ```html
   <!-- Change this: -->
   <script src="config.js"></script>
   
   <!-- To this: -->
   <script src="config-local.js"></script>
   ```

2. Open `index.html` in your browser

3. Test with these codes (enter just the part after `MELA25-`):
   - `VALID1` → Should show John Doe's details
   - `USED1` → Should show "Already Used"
   - `XXXXX` → Should show "Invalid Ticket"

## Step 3: View Server Info

Visit http://localhost:3000/ in your browser to see:
- Complete list of test tickets
- API documentation
- Usage examples

## Test Scenarios

| Code | Expected Result |
|------|----------------|
| `VALID1`, `VALID2`, `ABC12`, `XYZ99` | Shows full ticket details (first scan only) |
| `USED1`, `USED2`, `OLD99` | Always shows "Already Used" |
| Any other code | Shows "Invalid Ticket" |

## Tips

- Server logs appear in the terminal where you started it
- Press Ctrl+C to stop the server
- Restart the server to reset "used" tickets
- Use custom port: `node mock-server.js 8080`

## Troubleshooting

**Can't connect?**
- Make sure mock server is running
- Check `config-local.js` has `http://localhost:3000`
- Try opening http://localhost:3000/ directly

**Port already in use?**
```bash
node mock-server.js 3001
# Then update config-local.js to use port 3001
```

---

For complete documentation, see [MOCK-SERVER-README.md](MOCK-SERVER-README.md)
