import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

/*
  IMPORTANT: Before running the application, you need to create the database and the 'candidates' table.
  Connect to your PostgreSQL instance and run the following SQL command:

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

*/
