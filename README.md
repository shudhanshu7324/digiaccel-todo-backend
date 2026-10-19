# To-Do List API

Node.js + Express + MongoDB/Mongoose REST API for the MERN assignment.

## Requirements
- Node.js 20+
- MongoDB local instance or MongoDB Atlas connection string

## Run locally
```bash
npm install
cp .env.example .env
# Set MONGODB_URI in .env
npm run dev
```
Windows PowerShell:
```powershell
Copy-Item .env.example .env
npm run dev
```
Health check: `GET http://localhost:5000/api/v1/health`

## Data model
`Task` fields:
- `title` (required, trimmed, 1–120 chars)
- `description` (optional, max 2000 chars)
- `scheduledAt` (required ISO date/time)
- `priority`: `low | medium | high` (default `medium`)
- `status`: `in_progress | completed` (default `in_progress`)
- timestamps: `createdAt`, `updatedAt`

## API endpoints
All endpoints are under `/api/v1`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/tasks` | Create task |
| GET | `/tasks` | List tasks with filters/search/pagination |
| GET | `/tasks/:id` | Get one task |
| PATCH | `/tasks/:id` | Update any task fields |
| PATCH | `/tasks/:id/status` | Update status only |
| DELETE | `/tasks/:id` | Delete task |
| GET | `/tasks/weekly-summary?from=YYYY-MM-DD&to=YYYY-MM-DD` | Weekly summary |
| GET | `/tasks/weeks/:weekStart` | Tasks in week starting on Monday |

### Create task example
```json
{
  "title": "Finish wireframe",
  "description": "Complete the mobile dashboard",
  "scheduledAt": "2026-10-23T10:30:00.000Z",
  "priority": "high"
}
```

### List/filter tasks
`GET /api/v1/tasks?q=wireframe&status=in_progress&priority=high&page=1&limit=10&sort=scheduledAt&order=asc`
Optional filters: `q`, `status`, `priority`, `from`, `to`, `page`, `limit`, `sort`, `order`.
- `q` searches title and description using an escaped case-insensitive regular expression.
- `from` and `to` are inclusive calendar-date boundaries interpreted as UTC dates.
- Response contains `data`, `pagination`.

### Weekly summary
`GET /api/v1/tasks/weekly-summary?from=2026-10-01&to=2026-11-01`
Groups tasks by Monday-start week (UTC) and returns `openCount`, `completedCount`, and `totalCount`. A task is counted in the week containing its `scheduledAt`.
If no range is supplied, the API returns weeks containing tasks from the current UTC week and the preceding 11 weeks.

### Week details
`GET /api/v1/tasks/weeks/2026-10-19`
`weekStart` must be a Monday in `YYYY-MM-DD` format. Returns tasks scheduled Monday through Sunday, with the Sunday boundary exclusive at the next Monday.

## Example responses
Successful create:
```json
{
  "success": true,
  "data": {
    "_id": "…",
    "title": "Finish wireframe",
    "description": "",
    "scheduledAt": "2026-10-23T10:30:00.000Z",
    "priority": "high",
    "status": "in_progress",
    "createdAt": "…",
    "updatedAt": "…"
  }
}
```
Errors have a consistent shape:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  }
}
```

## Notes
- This assignment version is a single-user task manager; authentication is not included because the brief does not require accounts.
- If you later add authentication, add `userId` to the schema and scope every query/update/delete to the authenticated user.
- `from`/`to` date-only filters use UTC. If the product should use each user's local timezone, define that contract and calculate boundaries accordingly.
- For production, use a managed MongoDB deployment, configure a specific `CLIENT_ORIGIN`, use a proper structured logger/monitoring, and add auth if tasks are user-specific.
