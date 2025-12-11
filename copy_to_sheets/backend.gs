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
  const peopleEntering = parseInt(data.peopleEntering) || 0; // 0 means just checking status

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
  const colEntryStatus     = 8;  // H  (valid/partial/used)
  const colMailerStatus    = 9;  // I
  const colTotalEntered    = 10; // J  (running total of people entered)
  const colEntryLog        = 11; // K  (JSON array of entry events)

  // iterate rows skipping header
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][colTicketId - 1]) === String(ticketId)) {
      const numberOfPeople = parseInt(values[i][colNumPeople - 1]) || 0;
      const currentStatus = values[i][colEntryStatus - 1] || "valid";
      const totalEntered = parseInt(values[i][colTotalEntered - 1]) || 0;
      
      // Parse existing entry log or initialize empty array
      let entryLog = [];
      try {
        const logValue = values[i][colEntryLog - 1];
        if (logValue) {
          entryLog = JSON.parse(logValue);
        }
      } catch (e) {
        entryLog = [];
      }

      // If peopleEntering is 0, just return current status (no entry recorded)
      if (peopleEntering === 0) {
        let result = "VALID";
        if (currentStatus === "used") {
          result = "ALREADY_USED";
        } else if (currentStatus === "partial") {
          result = "PARTIAL";
        }
        
        return jsonWithCors({
          result: result,
          name:            values[i][colName - 1],
          iAm:             values[i][colIAm - 1],
          numberOfPeople:  numberOfPeople,
          transport:       values[i][colTransport - 1],
          ticketId:        values[i][colTicketId - 1],
          entryStatus:     currentStatus,
          totalEntered:    totalEntered,
          entryLog:        entryLog
        });
      }

      // Record the entry
      const newTotalEntered = totalEntered + peopleEntering;
      const timestamp = new Date();
      
      // Add to entry log
      entryLog.push({
        count: peopleEntering,
        timestamp: timestamp.toISOString(),
        cumulative: newTotalEntered
      });

      // Determine new status
      let newStatus;
      if (newTotalEntered >= numberOfPeople) {
        newStatus = "used";
      } else {
        newStatus = "partial";
      }

      // Update the sheet
      sheet.getRange(i + 1, colEntryStatus).setValue(newStatus);
      sheet.getRange(i + 1, colTotalEntered).setValue(newTotalEntered);
      sheet.getRange(i + 1, colEntryLog).setValue(JSON.stringify(entryLog));
      sheet.getRange(i + 1, colTimestamp).setValue(timestamp);

      // Determine result based on whether this exceeds registration
      let result = "VALID";
      let isOverCapacity = newTotalEntered > numberOfPeople;

      return jsonWithCors({
        result: result,
        name:            values[i][colName - 1],
        iAm:             values[i][colIAm - 1],
        numberOfPeople:  numberOfPeople,
        transport:       values[i][colTransport - 1],
        ticketId:        values[i][colTicketId - 1],
        entryStatus:     newStatus,
        totalEntered:    newTotalEntered,
        entryLog:        entryLog,
        isOverCapacity:  isOverCapacity
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
