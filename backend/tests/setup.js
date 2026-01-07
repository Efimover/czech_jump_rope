import { pool } from "../db/index.js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

beforeAll(async () => {
    // sanity check
    if (!process.env.DATABASE_URL.includes("test")) {
        throw new Error("❌ TESTS MUST USE TEST DATABASE");
    }
});

afterAll(async () => {
    await pool.end();
});