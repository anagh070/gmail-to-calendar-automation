# 🗓️ Gmail to Google Calendar Event Automator

A Google Apps Script that scans your Gmail inbox for recent emails, extracts natural language dates and times (like _"July 3 at 5:30 PM"_), and auto-creates calendar events in your Google Calendar — all with zero input from you.

## 🔧 Features

- ✅ Automatically processes recent emails (last 3 days)
- ✅ Parses event-like phrases from message body using regex
- ✅ Creates accurate timed or all-day events in your primary Google Calendar
- ✅ Avoids duplicate events intelligently
- ✅ Skips past dates and irrelevant messages (like promotions)
- ✅ Labels processed threads with `AutoScheduled`

## 🚀 Use Case

You get messages like:

> _"Let's meet on July 3 at 5:30 PM to talk about the idea."_

Instead of manually checking and adding this to your calendar, the script automatically recognizes the date, time, and subject — and adds it to your calendar instantly.

## 📦 How It Works

1. Scans your Gmail inbox for emails newer than 3 days and **not labeled** `AutoScheduled`.
2. Uses regex-based patterns to find dates and times in natural English (e.g., "July 3 at 5:30 PM").
3. Parses those into valid JavaScript `Date` objects.
4. Skips:
   - Past events
   - Duplicate entries
   - Promotional emails
5. Adds the event to Google Calendar with:
   - Subject as the event name
   - Time block of 1 hour (default)
   - `All-day` event if no time is found
6. Labels the thread to prevent reprocessing.

## 📂 File Structure

- `autoAddToCalendar.gs` — Main logic and utility functions
- No external dependencies — runs entirely in Google Apps Script

## 🛠️ Setup Instructions

1. Open [Google Apps Script](https://script.google.com/)
2. Create a new project
3. Replace the default `Code.gs` with the content of `autoAddToCalendar.gs`
4. Save the file with `.gs` extension
5. Click **Triggers > Add Trigger**
   - Function: `autoAddToCalendar`
   - Event type: **Time-driven** (choose e.g., every hour)
6. Authorize the script with required permissions

> Make sure your Gmail inbox has relevant messages within the past 3 days for testing.

## 🧠 Customization Tips

- 🔍 Adjust the `GmailApp.search()` query for different email filters
- ⏳ Change `duration` from `60` minutes to desired default time
- 🕵️ Add more regex patterns in `findDates()` for broader date formats

## 📝 Example Output in Calendar

| Email Subject       | Message Body                                               | Created Event                |
|---------------------|------------------------------------------------------------|------------------------------|
| "Quick catch-up"    | "Let's meet on July 3 at 5:30 PM to talk about the idea."  | July 3, 5:30 PM – 6:30 PM    |
| "Vacation Reminder" | "Leaving 14th August for Goa"                              | August 14 (All-day event)    |

## 📜 License

MIT — free to use and modify.

---

> 🧠 _Built to save time. Set it once and forget it._ ✨
