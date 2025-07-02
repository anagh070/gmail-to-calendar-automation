// == AUTO ADD TO CALENDAR ==
// Add this script to Google Apps Script (.gs) file and run `autoAddToCalendar` manually or on a trigger.

function autoAddToCalendar() {
  const USER_TIMEZONE = 'Asia/Kolkata';
  const labelName = "AutoScheduled";
  const calendar = CalendarApp.getDefaultCalendar();
  const log = (...args) => console.log("Info", ...args);
  const warn = (...args) => console.warn(...args);

  console.log("🔄 Checking Gmail threads...");

  const label = getOrCreateLabel_(labelName);
  const threads = GmailApp.search('-category:promotions -label:' + labelName + ' newer_than:3d');
  console.log("🔍 Threads found:", threads.length);

  for (const thread of threads) {
    try {
      const subject = thread.getFirstMessageSubject();
      const messages = thread.getMessages();
      let eventCreated = false;

      for (const message of messages) {
        const body = message.getPlainBody();
        const dates = findDates(body);

        log(`📧 Subject: "${subject}" | Date candidates: ${dates.length}`);

        for (const dateInfo of dates) {
          const start = dateInfo.start;
          if (!start || isNaN(start.getTime())) continue;

          if (start < new Date()) {
            warn("⏪ Skipped - Date in past:", start);
            continue;
          }

          if (eventExists(calendar, subject, start)) {
            warn("⏭️ Skipped - Duplicate event exists");
            continue;
          }

          const title = cleanSubject(subject) || "Untitled Event";

          if (dateInfo.isAllDay) {
            calendar.createAllDayEvent(title, start);
          } else {
            const end = new Date(start.getTime() + (dateInfo.duration || 60) * 60 * 1000);
            calendar.createEvent(title, start, end);
          }

          log(`✅ Event created: ${title} at ${start}`);
          eventCreated = true;
        }
      }

      if (eventCreated) thread.addLabel(label);
    } catch (err) {
      console.error("❌ Thread error:", err);
    }
  }

  console.log("✅ Script completed");
}

// == HELPERS ==

// 📍 Get or create Gmail label
function getOrCreateLabel_(name) {
  let label = GmailApp.getUserLabelByName(name);
  if (!label) label = GmailApp.createLabel(name);
  return label;
}

// 📍 Clean subject line for event title
function cleanSubject(subject) {
  return subject
    .replace(/^(Re:|Fwd:|Fw:)\s*/i, '')
    .replace(/\[.*?\]/g, '')
    .trim()
    .substring(0, 100);
}

// 📍 Detect possible date/time strings in email
function findDates(text) {
  const matches = [];

  const lines = text.split('\n').map(line => line.trim().toLowerCase());
  let pendingDate = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match: 🗓️ Date: 30-06-2025
    if (line.match(/^date[:\s🗓️\-]+/i)) {
      pendingDate = line.replace(/^date[:\s🗓️\-]+/i, '').trim();
    }

    // Match: 🕕 Time: 6:00 PM – 8:00 PM
    if (pendingDate && line.match(/^time[:\s🕕\-]+/i)) {
      let timeLine = line.replace(/^time[:\s🕕\-]+/i, '').trim();
      // Extract only first time if it's a range
      const firstTime = timeLine.split(/[–-]/)[0].trim();
      const combined = `${pendingDate} ${firstTime}`;
      const parsed = parseDateString(combined);
      if (parsed.start) matches.push(parsed);
      pendingDate = null;
    }

    // Direct match: 30/06/2025 at 6:00 PM
    const directDT = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})[ ,]*(\d{1,2}:\d{2}\s*(am|pm)?)/i.exec(line);
    if (directDT) {
      const combined = `${directDT[1]} ${directDT[2]}`;
      const parsed = parseDateString(combined);
      if (parsed.start) matches.push(parsed);
    }

    // Format: Jun 30, 2025 6:00 PM India
    const matchFancy = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}.*?\d{1,2}:\d{2}\s*(am|pm)?/gi.exec(line);
    if (matchFancy) {
      const raw = matchFancy[0].replace(/india|ist|gmt.*$/i, '').trim();
      const parsed = parseDateString(raw);
      if (parsed.start) matches.push(parsed);
    }
  }

  // Plain time only (with contextual scan)
  const timeOnly = text.match(/\b\d{1,2}(:\d{2})?\s*(am|pm)\b/gi) || [];
  for (const rawTime of timeOnly) {
    const index = text.indexOf(rawTime);
    const before = text.slice(Math.max(0, index - 60), index);
    const dateHint = before.match(/\b(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\b/i);
    if (dateHint) {
      const combined = `${dateHint[0]} ${rawTime}`;
      const parsed = parseDateString(combined);
      if (parsed.start) matches.push(parsed);
    }
  }

  return matches;
}

// 📍 Parse natural date string using Moment.js
function parseDateString(raw) {
  try {
    let input = raw
      .replace(/(st|nd|rd|th)/gi, '')
      .replace(/,\s*/g, ' ')
      .replace(/\s*at\s*/gi, ' ')
      .replace(/–|—/g, '-') // normalize dash
      .replace(/\s+/g, ' ')
      .replace(/(\d)(am|pm)/gi, '$1 $2')
      .trim();

    if (!/\d{4}/.test(input)) input += ' ' + new Date().getFullYear();

    const momentDate = Moment.moment(input, [
      "D MMM YYYY h:mm A",
      "MMM D YYYY h:mm A",
      "D MMM h:mm A",
      "MMM D h:mm A",
      "DD-MM-YYYY h:mm A",
      "DD/MM/YYYY h:mm A",
      "DD-MM-YYYY",
      "YYYY-MM-DDTHH:mm:ss",
      "YYYY-MM-DD HH:mm",
      "h:mm A",
      "h:mm"
    ], true);

    return {
      raw,
      start: momentDate.isValid() ? momentDate.toDate() : null,
      isAllDay: !/\d{1,2}:\d{2}/.test(input),
      duration: 60
    };
  } catch {
    return { raw, start: null };
  }
}

// 📍 Check for duplicate event
function eventExists(calendar, title, start) {
  const windowStart = new Date(start.getTime() - 30 * 60000);
  const windowEnd = new Date(start.getTime() + 30 * 60000);
  const events = calendar.getEvents(windowStart, windowEnd, {
    search: title.substring(0, 30)
  });
  return events.length > 0;
}
