import dotenv from "dotenv";

if (process.env.NODE_ENV === "test") {
    dotenv.config({ path: ".env.test" });
} else {
    dotenv.config();
}

import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});