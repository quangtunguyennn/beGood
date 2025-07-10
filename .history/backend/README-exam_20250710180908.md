# Exam Manager Backend

This is the backend API for the Exam Manager web app.

## Features
- RESTful API for exams (CRUD)
- In-memory notifications API
- Uses NeDB for persistent storage (exams.db)
- CORS enabled for local frontend development

## Endpoints

### Exams
- `GET /api/exams` — List all exams
- `POST /api/exams` — Add a new exam (`{ title, date, time, done? }`)
- `DELETE /api/exams/:id` — Delete exam by id
- `DELETE /api/exams` — Remove all exams marked as done
- `PATCH /api/exams/:id` — Update exam (mark done/undone)

### Notifications
- `GET /api/notices` — List all notifications (in-memory)
- `POST /api/notices` — Add a notification (`{ message }`)
- `DELETE /api/notices` — Clear all notifications

## Usage

1. Install dependencies:
   ```sh
   npm install express nedb cors
   ```
2. Start the server:
   ```sh
   node exam-api.js
   ```
3. The API will run on `http://localhost:4003/` by default.

---
