# Assignment Manager Backend

This is the backend API for the Assignment Manager web app.

## Features
- RESTful API for assignments (CRUD)
- In-memory notifications API
- Uses NeDB for persistent storage (assignments.db)
- CORS enabled for local frontend development

## Endpoints

### Assignments
- `GET /api/assignments` — List all assignments
- `POST /api/assignments` — Add a new assignment (`{ title, dueDate, done? }`)
- `DELETE /api/assignments/:id` — Delete assignment by id
- `DELETE /api/assignments` — Remove all assignments marked as done
- `PATCH /api/assignments/:id` — Update assignment (mark done/undone)

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
   node assignment-api.js
   ```
3. The API will run on `http://localhost:4002/` by default.

---
