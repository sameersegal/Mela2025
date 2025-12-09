# Mela 2025 Entry Pass System

A QR code-based entry pass system for Mela 2025 attendees. This system allows users to register via Google Forms, automatically receive a QR code entry pass via email, and enables event staff to scan and validate passes at the venue.

## 📋 Overview

This project consists of two main components:

1. **Backend (Google Apps Script)**: Automated QR code generation and email delivery system integrated with Google Forms and Sheets
2. **Frontend (Netlify)**: Web-based QR code scanner for entry validation

### How It Works

1. **Registration**: Attendee fills out a Google Form with their details
2. **Automatic Email**: Google Apps Script triggers automatically, generates a unique QR code (format: `MELA25-XXXXX`), and emails the entry pass
3. **Entry Validation**: Event staff scan the QR code using the web app, which validates against the Google Sheet and marks the ticket as used

## 🏗️ Architecture

```
Google Form → Google Sheet → Apps Script Backend
                                    ↓
                              Email with QR Code
                                    ↓
                            Frontend Scanner (Netlify)
                                    ↓
                            Apps Script API Validation
                                    ↓
                            Update Google Sheet Status
```

## 📦 Project Structure

```
.
├── index.html               # Frontend QR scanner web app
├── mailer.gs               # Apps Script - QR generation & email automation
├── backend.gs              # Apps Script - API endpoint for ticket validation
├── build.ps1               # PowerShell script for Netlify deployment
├── mock-server.js          # Local mock server for testing (zero dependencies)
├── config-local.js         # Local testing configuration
├── test-mock-server.html   # Interactive mock server test page
├── MOCK-SERVER-README.md   # Detailed mock server documentation
└── .env                    # Configuration file (API URL)
```

## 🧪 Local Development & Testing

For local frontend development without requiring the Google Apps Script backend, use the included mock server:

### Quick Start

```bash
# 1. Start the mock server
node mock-server.js

# 2. In another terminal, serve the frontend (choose one):
python -m http.server 8000
# or
npx http-server
# or just open index.html in your browser

# 3. Update index.html to use local config
# Replace the config.js script tag with config-local.js
```

### Test Tickets

The mock server includes pre-configured test tickets:

- **Valid**: `MELA25-VALID1`, `MELA25-VALID2`, `MELA25-ABC12`, `MELA25-XYZ99`
- **Already Used**: `MELA25-USED1`, `MELA25-USED2`, `MELA25-OLD99`
- **Invalid**: Any other code (e.g., `MELA25-XXXXX`)

### Interactive Testing

Open `test-mock-server.html` in a browser for an interactive test interface, or visit `http://localhost:3000/` for the mock server info page.

For complete documentation, see [MOCK-SERVER-README.md](MOCK-SERVER-README.md).

## 🚀 Production Deployment Guide

### Prerequisites

**For Production Deployment:**
- Google Account with access to Google Sheets and Apps Script
- Google Cloud Console project (for production use)
- Netlify account (free tier works fine)

**For Local Development:**
- Node.js (v12 or higher) - for running the mock server
- A modern web browser with camera support

### Part 1: Google Cloud Console Setup

This step is required for deploying the Apps Script as a web app that can be accessed by your frontend.

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Note your Project Number (you'll need this later)

2. **Enable Required APIs**
   - In the Cloud Console, navigate to "APIs & Services" > "Library"
   - Enable the following APIs:
     - Google Sheets API
     - Gmail API (for sending emails)
     - Google Apps Script API

3. **Configure OAuth Consent Screen** (For Personal Use)
   - Navigate to "APIs & Services" > "OAuth consent screen"
   - Select "External" user type (since this is for personal use)
   - Fill in the required fields:
     - App name: "Mela 2025 Entry System"
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/spreadsheets`
     - `https://www.googleapis.com/auth/gmail.send`
   - Add test users (your Google account email)
   - Save and continue

### Part 2: Google Sheets & Apps Script Setup

1. **Create Google Form**
   - Create a new Google Form with the following fields:
     - Name (Short answer)
     - Email (Email)
     - I am (Multiple choice: e.g., Student, Teacher, Parent, Guest)
     - Number of People (Number)
     - Transport (Multiple choice: e.g., Own Transport, Bus)
   - Link the form to a Google Sheet (responses will be saved here)

2. **Prepare the Google Sheet**
   - Open the linked Google Sheet
   - Rename the responses sheet to "Registrations"
   - Ensure columns are in this order:
     - A: Timestamp
     - B: Name
     - C: Email
     - D: I am
     - E: Number of People
     - F: Transport
     - G: Mela Pass (will be auto-filled by script)
     - H: Entry Status (will be updated when scanned)
     - I: Mailer Status (tracks email sending status)

3. **Add Apps Script Code**
   - In your Google Sheet, go to **Extensions > Apps Script**
   - Delete any default code
   - Create two script files:
     
     **File 1: main.gs**
     - Copy the contents of `main.gs` from this repository
     
     **File 2: backend.gs**
     - Copy the contents of `backend.gs` from this repository

4. **Link to Google Cloud Project**
   - In the Apps Script editor, click on the project settings (gear icon)
   - Under "Google Cloud Platform (GCP) Project", click "Change project"
   - Enter your GCP Project Number from Part 1
   - Click "Set project"

5. **Set Up Form Submit Trigger**
   - In Apps Script editor, click on the clock icon (Triggers) in the left sidebar
   - Click "+ Add Trigger"
   - Configure:
     - Function: `generateQRCodeAndEmail`
     - Event source: `From spreadsheet`
     - Event type: `On form submit`
   - Click "Save"
   - Grant necessary permissions when prompted

6. **Deploy as Web App**
   - Click on "Deploy" > "New deployment"
   - Click on "Select type" > "Web app"
   - Configure:
     - Description: "Mela 2025 Backend API"
     - Execute as: "Me"
     - Who has access: "Anyone" (required for the frontend to access it)
   - Click "Deploy"
   - Copy the Web App URL (you'll need this for the frontend)
   - The URL will look like: `https://script.google.com/macros/s/xxxxx/exec`

7. **Test the Setup**
   - Submit a test entry in your Google Form
   - Check if:
     - A unique ID appears in column G (Mela Pass)
     - Status in column I shows "SENT"
     - You received an email with the QR code

### Part 3: Frontend Deployment to Netlify

1. **Configure the Frontend**
   - Create a `.env` file in the project root (or update existing one):
     ```env
     API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
     ```
     Replace `YOUR_DEPLOYMENT_ID` with the ID from your Apps Script Web App URL

2. **Build the Deployment Package**
   
   **Option A: Using PowerShell (Windows)**
   ```powershell
   .\build.ps1
   ```
   This will:
   - Read the `.env` file
   - Generate `config.js` with your API URL
   - Create `mela2025-netlify.zip` with `index.html` and `config.js`

   **Option B: Manual Build**
   - Create `config.js`:
     ```javascript
     const API_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
     ```
   - Create a zip file containing:
     - `index.html`
     - `config.js`

3. **Deploy to Netlify**
   
   **Option A: Drag & Drop (Easiest)**
   - Go to [https://app.netlify.com/drop](https://app.netlify.com/drop)
   - Drag and drop `mela2025-netlify.zip` or the folder containing both files
   - Your site will be deployed instantly!
   - Netlify will provide a URL like: `https://random-name.netlify.app`

   **Option B: Git-Based Deployment**
   - Connect your GitHub repository to Netlify
   - Configure build settings:
     - Build command: (leave empty or use your build script)
     - Publish directory: `/` (root)
   - Add environment variable in Netlify:
     - Key: `API_URL`
     - Value: Your Apps Script Web App URL
   - Deploy

4. **Test the Frontend**
   - Open your Netlify URL
   - Try scanning the QR code from the test email
   - Or use manual entry with a ticket code (e.g., `MELA25-QZ0R0`)
   - Verify that:
     - Valid tickets show attendee details
     - Already used tickets show "ALREADY USED" status
     - Invalid tickets show "INVALID" status

## 🔧 Configuration

### Environment Variables

The `.env` file should be created in the root directory. See the Frontend Deployment section (Part 3, Step 1) above for details on creating and configuring this file.

### Google Sheet Column Mapping

The Apps Script expects the following column structure:

| Column | Field | Description |
|--------|-------|-------------|
| A | Timestamp | Automatically filled by Google Forms |
| B | Name | Attendee name |
| C | Email | Attendee email |
| D | I am | Attendee type (Student/Teacher/Parent/Guest) |
| E | Number of People | Number of attendees |
| F | Transport | Transportation method |
| G | Mela Pass | Auto-generated unique ID (MELA25-XXXXX) |
| H | Entry Status | Updated to "used" when scanned |
| I | Mailer Status | Email sending status (SENT/ERROR) |

## 📱 Usage

### For Event Staff

1. Open the Netlify-deployed web app on a mobile device or tablet
2. Allow camera access when prompted
3. Point the camera at the attendee's QR code
4. The app will automatically:
   - Validate the ticket
   - Display attendee information
   - Mark the ticket as used in the Google Sheet
5. For manual entry, type the code (without `MELA25-` prefix) and click "Check"

### For Attendees

1. Fill out the Google Form registration
2. Receive email with QR code entry pass
3. Show the QR code (from email or screenshot) at the event entrance
4. Entry staff will scan and validate

## 🔒 Security Notes

- The `.env` file contains sensitive URLs and should not be committed to version control (already in `.gitignore`)
- The Apps Script Web App is set to "Anyone" access, but validates all requests against the Google Sheet
- Each ticket can only be used once - subsequent scans will show "ALREADY USED"
- Ticket IDs are randomly generated 5-character alphanumeric codes with collision detection

## 🐛 Troubleshooting

### Email Not Sending
- Check that Gmail API is enabled in Google Cloud Console
- Verify the Apps Script trigger is properly configured
- Check column I (Mailer Status) for error messages

### QR Scanner Not Working
- Ensure camera permissions are granted in the browser
- Try using HTTPS (required for camera access)
- Test with manual entry to verify API connectivity

### "INVALID" for Valid Tickets
- Verify the API URL in `config.js` matches your Apps Script deployment
- Check that the Web App is deployed with "Anyone" access
- Look at browser console for network errors

### Duplicate Ticket IDs
- The system automatically checks for duplicates before generating
- If duplicates occur, check the `generateUniqueId` function in `main.gs`

## 📄 License

This project is for personal/educational use for Mela 2025 event.

## 👥 Credits

Developed for Mela 2025 at The Valley School.

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Google Apps Script execution logs (View > Executions in Apps Script editor)
3. Check browser console for frontend errors
