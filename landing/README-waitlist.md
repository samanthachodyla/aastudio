# Launch waitlist → Sheet + email + Meta CAPI + GA4 server-side

The landing page's "Get first access" form posts each signup to a **Google Apps
Script Web App** that you own. On every submission it:

1. Appends a row to a **Google Sheet** (updates live).
2. Emails **cara@allegoryartconsulting.com**.
3. Sends a **Meta Conversions API "Lead"** (server-side), de-duplicated with the
   browser Pixel via a shared `event_id`.
4. Sends a **GA4 `waitlist_signup_server` event** (Measurement Protocol), stamped
   with the browser's GA client id.

## First-time setup

1. Create a Google Sheet → **Extensions → Apps Script** → paste the script below
   into `Code.gs` → **Save**.
2. **Deploy → New deployment → Web app**, Execute as **Me**, Who has access
   **Anyone** → Deploy → authorize.
3. Copy the `/exec` URL → it goes in `WAITLIST_ENDPOINT` in `src/pages/Landing.tsx`.

## Turn on the two server-side trackers

**Meta CAPI token:** Events Manager → Data Sources → your pixel
(1583309690064748) → Settings → Conversions API → **Generate access token** →
paste into `META_CAPI_TOKEN`.

**GA4 API secret:** GA4 → Admin → Data Streams → your web stream → **Measurement
Protocol API secrets → Create** → paste the secret value into `GA4_API_SECRET`.
(The Measurement ID `G-CSJ5CQZ382` is already filled in.)

Then **redeploy**: Deploy → **Manage deployments → edit ✏️ → Version: New version
→ Deploy.** (Editing the code alone does not publish it.)

Until each token/secret is set, that tracker is simply skipped — signups, the
sheet, and the email keep working.

## The script (`Code.gs`)

```javascript
// Allegory Art Studio — launch-list endpoint.
// Sheet + email + Meta CAPI (deduped with the Pixel) + GA4 Measurement Protocol.

var NOTIFY = "cara@allegoryartconsulting.com";

var META_PIXEL_ID   = "1583309690064748";
var META_CAPI_TOKEN = "PASTE_YOUR_CONVERSIONS_API_TOKEN_HERE";

var GA4_MEASUREMENT_ID = "G-CSJ5CQZ382";
var GA4_API_SECRET     = "PASTE_YOUR_GA4_API_SECRET_HERE";

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
      try { sendGa4Event(p);     } catch (gaErr)   { /* never block signup */ }
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
  if (!META_CAPI_TOKEN || META_CAPI_TOKEN.indexOf("PASTE_") === 0) return;
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
      event_id: p.event_id || "",           // matches the browser Pixel -> Meta de-dupes
      action_source: "website",
      event_source_url: p.event_source_url || "https://allegoryartstudio.com/",
      user_data: userData,
      custom_data: { content_name: "waitlist", source: p.source || "landing" }
    }]
  };
  var url = "https://graph.facebook.com/v21.0/" + META_PIXEL_ID +
            "/events?access_token=" + encodeURIComponent(META_CAPI_TOKEN);
  UrlFetchApp.fetch(url, { method: "post", contentType: "application/json",
    payload: JSON.stringify(payload), muteHttpExceptions: true });
}

// ---- GA4 Measurement Protocol (server-side event) ----
function sendGa4Event(p) {
  if (!GA4_API_SECRET || GA4_API_SECRET.indexOf("PASTE_") === 0) return;
  var clientId = (p.ga_client_id || "").toString();
  if (!clientId) return;                     // no client id -> skip (avoids ghost users)
  var payload = {
    client_id: clientId,
    events: [{
      name: "waitlist_signup_server",
      params: {
        source: p.source || "landing",
        utm_source: p.utm_source || "",
        utm_campaign: p.utm_campaign || "",
        engagement_time_msec: 1
      }
    }]
  };
  var url = "https://www.google-analytics.com/mp/collect?measurement_id=" +
            encodeURIComponent(GA4_MEASUREMENT_ID) + "&api_secret=" + encodeURIComponent(GA4_API_SECRET);
  UrlFetchApp.fetch(url, { method: "post", contentType: "application/json",
    payload: JSON.stringify(payload), muteHttpExceptions: true });
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
- **Meta:** browser Pixel + server share `event_id` → Meta counts one Lead.
- **GA4:** the server sends a distinct `waitlist_signup_server` event (GA4 has no
  event-id dedup). Because *every* signup hits the server, this event is the true
  total; the browser `waitlist_signup` is a subset (misses ad-blocked users).
  Comparing the two shows exactly how much the browser is missing. Mark whichever
  you prefer as a key event in GA4 → Admin → Key events.
- Email is **SHA-256 hashed** before it reaches Meta; GA4 receives no email.
- Verify: Meta **Events Manager → Test Events**; GA4 **Admin → DebugView** (or
  Realtime a couple minutes later).
