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


// ✅ Create or reuse label
function getOrCreateLabel_(name) {
  let label = GmailApp.getUserLabelByName(name);
  if (!label) label = GmailApp.createLabel(name);
  return label;
}


// ✅ Clean subject line
function cleanSubject(subject) {
  return subject
    .replace(/^(Re:|Fwd:|Fw:)\s*/i, '')
    .replace(/\[.*?\]/g, '')
    .trim()
    .substring(0, 100);
}


// ✅ Match date strings
function findDates(text) {
  const dateRegexes = [
    // July 3 at 5:30 PM
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?\s+(?:at\s+)?\d{1,2}:\d{2}\s*(am|pm)?\b/gi,

    // 3rd July 2025 at 5:30 PM
    /\b\d{1,2}(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\s+(?:at\s+)?\d{1,2}:\d{2}\s*(am|pm)?\b/gi
  ];

  const matches = [];

  for (const regex of dateRegexes) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const raw = match[0];
      const parsed = parseDateString(raw);
      if (parsed.start) matches.push(parsed);
    }
  }

  return matches;
}


// ✅ Parse strings into JS Date
function parseDateString(dateStr) {
  const raw = dateStr.trim();
  try {
    let normalized = raw
      .replace(/(st|nd|rd|th)/gi, '')
      .replace(/,\s*/g, ' ')
      .replace(/\s*at\s*/gi, ' ')
      .replace(/\s+/g, ' ')
      .replace(/(\d)(am|pm)/gi, '$1 $2');

    if (!/\d{4}/.test(normalized)) {
      normalized += ' ' + new Date().getFullYear();
    }

    const parsedDate = new Date(normalized + ' GMT+0530');
    return {
      raw,
      start: isNaN(parsedDate.getTime()) ? null : parsedDate,
      isAllDay: false
    };
  } catch {
    return { raw, start: null };
  }
}


// ✅ Check if similar event already exists
function eventExists(calendar, title, start) {
  const windowStart = new Date(start.getTime() - 30 * 60000);
  const windowEnd = new Date(start.getTime() + 30 * 60000);
  const events = calendar.getEvents(windowStart, windowEnd, {
    search: title.substring(0, 30)
  });
  return events.length > 0;
}
