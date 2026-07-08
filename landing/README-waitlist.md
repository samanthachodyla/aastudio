# Launch waitlist → Google Sheet + email to Cara

The landing page's "Get first access" form sends each signup to a **Google Apps
Script Web App** that you own. That script does two things on every submission:

1. Appends a row to a **Google Sheet** (updates live).
2. Emails **cara@allegoryartconsulting.com** with the new signup.

No servers, no API keys, free. ~5 minutes to set up.

## Setup (one time)

1. Create a new **Google Sheet** (name it e.g. "Allegory Waitlist").
2. In that sheet: **Extensions → Apps Script**.
3. Delete whatever's in `Code.gs` and paste the script below. **Save** (💾).
4. **Deploy → New deployment**. Click the gear → **Web app**.
   - **Description:** Allegory waitlist
   - **Execute as:** Me
   - **Who has access:** **Anyone**
5. **Deploy**, then **Authorize access** and allow the permissions (it needs to
   edit the sheet and send email as you).
6. Copy the **Web app URL** — it ends in `/exec`.
7. Send that URL to Claude (or paste it into `WAITLIST_ENDPOINT` in
   `src/pages/Landing.tsx`). Once it's set and deployed, the form is live.

To test the deployment: open the `/exec` URL in a browser — it should say
"Allegory waitlist endpoint is live."

## The script (`Code.gs`)

```javascript
// Allegory Art Studio — launch-list endpoint. Appends to this Sheet + emails Cara.
var NOTIFY = "cara@allegoryartconsulting.com";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Signups") || ss.insertSheet("Signups");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Email", "Source", "Referrer", "User Agent"]);
    }
    var p = (e && e.parameter) ? e.parameter : {};
    var email = (p.email || "").toString().trim();
    if (email) {
      var ts = new Date();
      sheet.appendRow([ts, email, p.source || "", p.referrer || "", p.user_agent || ""]);
      MailApp.sendEmail({
        to: NOTIFY,
        subject: "New Allegory waitlist signup: " + email,
        body: "New launch-list signup\n\n"
            + "Email: " + email + "\n"
            + "Source: " + (p.source || "") + "\n"
            + "Time: " + ts + "\n"
            + "Referrer: " + (p.referrer || "") + "\n"
            + "User agent: " + (p.user_agent || "") + "\n"
      });
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput("Allegory waitlist endpoint is live.");
}
```

## Notes
- Every signup lands in the **Signups** tab of your sheet, newest at the bottom,
  and Cara gets an email at the same time.
- Email is sent from your Google account. Consumer Gmail allows ~100 emails/day,
  Workspace ~1,500 — plenty for a launch list.
- To change who's notified, edit the `NOTIFY` line and redeploy.
