// Handle GET requests (for CORS preflight and testing)
function doGet(e) {
  // If ticketId is passed as query parameter, process it (read-only check)
  if (e && e.parameter && e.parameter.ticketId) {
    return checkTicket(e.parameter.ticketId, false); // false = don't mark as used
  }
  return jsonResponse({ result: "OK", message: "Service is running" });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ticketId = data.ticketId;

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Registrations");
  const values = sheet.getDataRange().getValues(); // all rows including header

  // Hard-coded column indices (1-based):
  const colTimestamp       = 1;  // A
  const colName            = 2;  // B
  const colEmail           = 3;  // C
  const colIAm             = 4;  // D
  const colNumPeople       = 5;  // E
  const colTransport       = 6;  // F
  const colTicketId        = 7;  // G  <-- assuming ticketId stored here (Mela Pass)
  const colEntryStatus     = 8;  // H
  const colMailerStatus    = 9;  // I

  // iterate rows skipping header
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][colTicketId - 1]) === String(ticketId)) {
      const status = values[i][colEntryStatus - 1];

      if (status === "used") {
        // Return ticket details even for already used tickets, but without email
        return jsonWithCors({
          result: "ALREADY_USED",
          name:            values[i][colName - 1],
          iAm:             values[i][colIAm - 1],
          numberOfPeople:  values[i][colNumPeople - 1],
          transport:       values[i][colTransport - 1],
          ticketId:        values[i][colTicketId - 1],
          entryStatus:     "used"
        });
      }

      // mark as used
      sheet.getRange(i + 1, colEntryStatus).setValue("used");
      // update timestamp
      sheet.getRange(i + 1, colTimestamp).setValue(new Date());

      // return ticket info (without email for privacy)
      return jsonWithCors({
        result: "VALID",
        name:            values[i][colName - 1],
        iAm:             values[i][colIAm - 1],
        numberOfPeople:  values[i][colNumPeople - 1],
        transport:       values[i][colTransport - 1],
        ticketId:        values[i][colTicketId - 1],
        entryStatus:     "used"
      });
    }
  }

  return jsonWithCors({ result: "INVALID" });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Alias for backward compatibility
function jsonWithCors(obj) {
  return jsonResponse(obj);
}
