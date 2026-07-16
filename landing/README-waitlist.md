# Launch waitlist → Google Sheet + email + Meta CAPI

The landing page's "Get first access" form sends each signup to a **Google Apps
Script Web App** that you own. On every submission it:

1. Appends a row to a **Google Sheet** (updates live).
2. Emails **cara@allegoryartconsulting.com**.
3. Sends a **Meta Conversions API (server-side) "Lead" event** — de-duplicated
   with the browser Pixel via a shared `event_id`, so Meta counts one conversion.

## First-time setup

1. Create a Google Sheet → **Extensions → Apps Script**.
2. Paste the script below into `Code.gs`, **Save**.
3. **Deploy → New deployment → Web app**, Execute as **Me**, Who has access
   **Anyone** → Deploy → authorize.
4. Copy the `/exec` Web app URL and give it to Claude (it goes in
   `WAITLIST_ENDPOINT` in `src/pages/Landing.tsx`).

## Turn on Meta CAPI (server-side)

1. In **Meta Events Manager → Data Sources → your pixel (1583309690064748) →
   Settings → Conversions API → Generate access token**. Copy it.
2. Paste it into `META_CAPI_TOKEN` in the script below.
3. **Redeploy** the change: Deploy → **Manage deployments → edit (pencil) →
   Version: New version → Deploy**. (Editing the code alone doesn't publish it.)

Until the token is set, the script simply skips the CAPI call — signups, the
sheet, and the email keep working.

## The script (`Code.gs`)

```javascript
// Allegory Art Studio — launch-list endpoint.
// Appends to this Sheet, emails Cara, and sends a Meta Conversions API "Lead",
// de-duplicated with the browser Pixel via the shared event_id.

var NOTIFY = "cara@allegoryartconsulting.com";
var META_PIXEL_ID = "1583309690064748";
// Events Manager > your pixel > Settings > Conversions API > Generate access token
var META_CAPI_TOKEN = "PASTE_YOUR_CONVERSIONS_API_TOKEN_HERE";

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
        body: "New launch-list signup\n\nEmail: " + email + "\nSource: " + (p.source || "") +
              "\nCampaign: " + (p.utm_campaign || p.utm_source || "") +
              "\nTime: " + ts + "\nReferrer: " + (p.referrer || "") + "\n"
      });
      try { sendMetaCapiLead(p); } catch (capiErr) { /* never block signup */ }
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput("Allegory waitlist endpoint is live.");
}

// ---- Meta Conversions API (server-side Lead) ----
function sendMetaCapiLead(p) {
  if (!META_CAPI_TOKEN || META_CAPI_TOKEN.indexOf("PASTE_") === 0) return; // not configured yet
  var email = (p.email || "").toString().trim().toLowerCase();
  if (!email) return;

  var userData = { em: [sha256Hex(email)] };
  if (p.user_agent) userData.client_user_agent = p.user_agent;
  if (p.fbp) userData.fbp = p.fbp;
  if (p.fbc) userData.fbc = p.fbc;

  var payload = {
    data: [{
      event_name: "Lead",
      event_time: Math.floor(Date.now() / 1000),
      event_id: p.event_id || "",            // matches the browser Pixel -> Meta de-dupes
      action_source: "website",
      event_source_url: p.event_source_url || "https://allegoryartstudio.com/",
      user_data: userData,
      custom_data: { content_name: "waitlist", source: p.source || "landing" }
    }]
  };

  var url = "https://graph.facebook.com/v21.0/" + META_PIXEL_ID +
            "/events?access_token=" + encodeURIComponent(META_CAPI_TOKEN);
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

function sha256Hex(input) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  var hex = "";
  for (var i = 0; i < raw.length; i++) {
    var b = (raw[i] + 256) % 256;
    hex += ("0" + b.toString(16)).slice(-2);
  }
  return hex;
}
```

## Notes
- Email is **SHA-256 hashed** before being sent to Meta (required; Meta never
  receives the raw address).
- The browser Pixel and this server event share `event_id`, so Meta merges them
  into a single Lead — no double counting.
- Test in **Events Manager → Test Events**: a signup should show both a
  "Browser" and "Server" Lead that collapse into one.
