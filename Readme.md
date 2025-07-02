# 📅 Gmail-to-Google Calendar Auto Scheduler

A Google Apps Script that automatically scans your Gmail inbox for emails containing date and time info and creates events in your Google Calendar — no manual entry required!

---

## 🚀 Features

- Parses natural language like:
  - `"Let's meet on 6th July at 10 PM"`
  - `"July 3, 5:30 PM"`
  - `"01/07/2025 4:00 PM"`
- Adds event to your default calendar
- Skips duplicate or past events
- Applies a `AutoScheduled` label to processed threads
- Pure JavaScript — no external libraries!

---

## ⚙️ Setup Instructions

1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project and paste `autoAddToCalendar.gs`
3. Save the script
4. From the menu, run the `autoAddToCalendar()` function (give permissions)
5. (Optional) Set a time-driven trigger to run it hourly/daily

---

## 💡 How It Works

1. Scans recent emails (last 3 days)
2. Searches for date & time patterns using multiple regular expressions
3. Parses the message and creates calendar events if:
   - Valid future time exists
   - It's not a duplicate
4. Tags thread with label `AutoScheduled`

---

## 🧠 Patterns Recognized

- `"6th July at 10 PM"`
- `"July 6, 2025 22:00"`
- `"02-07-2025 6:00 PM"`
- `"July 6"`
- `"Tomorrow at 5 PM"` (planned feature)

---

## 📁 File Structure
📁 your-project/
└── autoAddToCalendar.gs
└── README.md


---

## 🛠️ Dependencies

**None.**  
This script is built with native JavaScript only — no external libraries required.

---

## 📅 Author

Made with ☕ by [Anagh Saraf](https://github.com/anagh070)

---

