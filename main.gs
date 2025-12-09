/**
 * @OnlyCurrentDoc
 */

/**************************************************************
 * 1. Generate a 5-char alphanumeric code (A–Z, 0–9)
 **************************************************************/
function generateFiveCharCode() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var code = '';
  for (var i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**************************************************************
 * 2. Generate a collision-free Unique ID: MELA25-XXXXX
 **************************************************************/
function generateUniqueId(sheet) {
  var lastRow = sheet.getLastRow();
  var existingIds = [];

  if (lastRow > 1) {
    existingIds = sheet.getRange(2, 8, lastRow - 1, 1)
      .getValues()
      .flat()
      .filter(String); // Remove empty cells
  }

  while (true) {
    var code = generateFiveCharCode();
    var id = "MELA25-" + code;

    if (!existingIds.includes(id)) {
      return id;
    }

    // Loop continues until unique ID is found
  }
}

function generateQrURL(data) {
  return "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(data);
}


/**************************************************************
 * 3. MAIN FUNCTION: Generates QR + Sends Email + Records ID
 **************************************************************/
function generateQRCodeAndEmail(e) {
  var sheet = e.range.getSheet();
  var row = e.range.getRow();

  // Read all data for this row
  var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  var name = rowData[1];            // Column B
  var email = rowData[2];           // Column C
  var numberOfPeople = rowData[4];  // Column E

  // Columns for status tracking
  var uniqueIdCell = sheet.getRange(row, 7); // Column G
  var statusCell   = sheet.getRange(row, 9); // Column I

  // Prevent duplicate sending
  if (statusCell.getValue() === "SENT") {
    return;
  }

  // Generate a guaranteed unique ID
  var uniqueId = generateUniqueId(sheet);

  // Generate QR code blob using Apps Script's built-in chart service
  var qrURL = generateQrURL(uniqueId);

  try {
    /******************************************************
     * Send the email with inline QR
     ******************************************************/
    MailApp.sendEmail({
      to: email,
      subject: "Your Mela 2025 Entry Pass",
      htmlBody:
        "Hi " + name + ",<br><br>" +
        "Thank you for registering for <b>Mela 2025</b>.<br>" +
        "Please show the entry pass below at the gate:<br><br>" +
        "<div style='text-align:center;'>" +
        "<img src='" + qrURL + "' style='width:200px;height:200px;'/>" +
        "</div><br>" +
        "<b>Pass ID:</b> " + uniqueId + "<br>" +
        "<b>Number of People:</b> " + numberOfPeople + "<br><br>" +
        "Warmly,<br/>Sunitha Mahesh<br/>Principal - The Valley School"      
    });

    /******************************************************
     * Update the sheet only AFTER email succeeds
     ******************************************************/
    uniqueIdCell.setValue(uniqueId);
    statusCell.setValue("SENT");

  } catch (err) {
    statusCell.setValue("ERROR: " + err.message);
    console.error("Email Send Error:", err);
  }
}
