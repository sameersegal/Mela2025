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
        return json({ result: "ALREADY_USED" });
      }

      // mark as used
      sheet.getRange(i + 1, colEntryStatus).setValue("used");
      // update timestamp
      sheet.getRange(i + 1, colTimestamp).setValue(new Date());

      // return ticket info
      return json({
        result: "VALID",
        name:            values[i][colName - 1],
        email:           values[i][colEmail - 1],
        iAm:             values[i][colIAm - 1],
        numberOfPeople:  values[i][colNumPeople - 1],
        transport:       values[i][colTransport - 1],
        ticketId:        values[i][colTicketId - 1],
        entryStatus:     "used",
        mailerStatus:    values[i][colMailerStatus - 1]
      });
    }
  }

  return json({ result: "INVALID" });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
