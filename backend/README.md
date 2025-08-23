# Recruitment Dashboard - Backend API

This is the backend server for the Recruitment Dashboard application, built with Node.js, Express, and PostgreSQL.

## Setup and Installation

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [PostgreSQL](https://www.postgresql.org/download/) installed and running.

### 2. Install Dependencies

Navigate into the `backend` directory and run:

```bash
npm install
```

### 3. Setup PostgreSQL Database

1.  Connect to your PostgreSQL instance using a tool like `psql` or a GUI client (e.g., DBeaver, Postico).
2.  Create a new database. For example:
    ```sql
    CREATE DATABASE recruitment_db;
    ```
3.  Connect to your newly created database.
4.  Run the SQL script below to create the necessary `candidates` table. You can find this script also in `src/services/db.ts`.

    ```sql
    CREATE TABLE candidates (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(255),
      position VARCHAR(255),
      stage VARCHAR(255) NOT NULL,
      source VARCHAR(255),
      rating INT DEFAULT 0,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "interviewDate" VARCHAR(255),
      "interviewTime" VARCHAR(255),
      "interviewTimeChanged" BOOLEAN DEFAULT FALSE,
      history JSONB DEFAULT '[]',
      comments JSONB DEFAULT '[]',
      "hasResume" BOOLEAN DEFAULT FALSE,
      "testResults" JSONB DEFAULT '[]',
      "portalToken" VARCHAR(255)
    );
    ```

### 4. Configure Environment Variables

1.  In the `backend` directory, create a copy of the example environment file:
    ```bash
    cp .env.example .env
    ```
2.  Open the new `.env` file and edit the `DATABASE_URL` with your actual PostgreSQL connection details. The format is:
    `postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME`

    **Example:**
    `DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/recruitment_db"`

## Running the Server

### For Development

This command will start the server using `ts-node-dev`, which automatically restarts the server when you make changes to the code.

```bash
npm run dev
```

The server will be running on `http://localhost:4000` (or the port you specified in your `.env` file).

### For Production

1.  First, build the TypeScript code into JavaScript:
    ```bash
    npm run build
    ```
2.  Then, start the server from the compiled code in the `dist` folder:
    ```bash
    npm start
    ```

## API Endpoints

The base URL is `/api`.

-   `GET /candidates`: Get all candidates.
-   `GET /candidates/:id`: Get a single candidate by ID.
-   `POST /candidates`: Create a new candidate.
-   `PUT /candidates/:id`: Update an existing candidate.
-   `DELETE /candidates/:id`: Delete a candidate.
