# Twitter Lite (React Native client + Mongo backend)

This repo now contains:

- A React Native compatible front-end (currently using CRA for web preview) under `src/`
- A Node/Express API server with MongoDB persistence under `server/`

The login/register screens call the `/api/auth/*` endpoints, while the feed pulls from `/api/posts`. Tokens are issued as JSON Web Tokens (JWT) and must be sent in the `Authorization: Bearer <token>` header for protected routes.

## Stack

- React / React Native compatible UI code
- Express + MongoDB (via Mongoose) backend
- JWT authentication with bcrypt password hashing

## Local setup

### 1. Frontend (React)

```bash
npm install
npm start
```

The dev server listens on `http://localhost:3000`.

### 2. Backend (Express + MongoDB)

```bash
cd server
npm install
copy env.example .env   # or manually create server/.env
npm run dev
```

Environment variables:

| Name | Description | Default |
| --- | --- | --- |
| `PORT` | API port | `4000` |
| `MONGODB_URI` | Mongo connection string | `mongodb://127.0.0.1:27017/twitterlite` |
| `JWT_SECRET` | Secret for signing tokens | _required_ |
| `JWT_EXPIRES_IN` | Token lifetime | `1d` |
| `CLIENT_ORIGIN` | Comma-separated list of allowed origins | `http://localhost:3000` |

The backend automatically creates the `twitterlite` database (or whatever you configure). Make sure MongoDB is running locally or supply a cloud URI (e.g., Atlas).

### API quick reference

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Body: `{ username, password }`. Creates account. |
| `POST` | `/api/auth/login` | Body: `{ username, password }`. Returns `{ token }`. |
| `GET` | `/api/posts` | Requires JWT. Returns recent posts. |
| `POST` | `/api/posts` | Requires JWT. Body: `{ content }`. Creates a new post. |

Tokens returned by `login` should be stored on the device (e.g., secure storage) and attached to subsequent requests.

## Testing

1. Run MongoDB (`mongod`) locally or provision a URI.
2. Start the backend (`npm run dev` inside `server/`).
3. Launch the frontend (`npm start` at repo root).
4. Register a user, then log in and create a post. Refresh to verify the data persists.

## Deployment notes

- For production, never commit the `server/.env` file. Set environment variables via your hosting platform.
- Update `REACT_APP_API_BASE` (see `src/api.js`) if the API lives on a different domain/port.
