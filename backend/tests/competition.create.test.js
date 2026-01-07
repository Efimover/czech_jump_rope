import request from "supertest";
import app from "../app.js";
import { createUser, authCookie } from "./helpers/auth.js";

describe("Competition creation", () => {
    it("organizator can create competition", async () => {
        const userId = await createUser({
            email: "org@test.cz",
            role: "organizator",
            active_role: "organizator"
        });

        const res = await request(app)
            .post("/api/competitions")
            .set("Cookie", authCookie(userId))
            .send({
                name: "Test Cup",
                start_date: "2026-01-01",
                end_date: "2026-01-02",
                reg_start: "2025-12-01",
                reg_end: "2025-12-31"
            });

        expect(res.status).toBe(201);
        expect(res.body.competition.name).toBe("Test Cup");
    });

    it("user cannot create competition", async () => {
        const userId = await createUser({
            email: "user@test.cz",
            role: "user",
            active_role: "user"
        });

        const res = await request(app)
            .post("/api/competitions")
            .set("Cookie", authCookie(userId))
            .send({
                name: "Hack Cup",
                start_date: "2026-01-01",
                end_date: "2026-01-02",
                reg_start: "2025-12-01",
                reg_end: "2025-12-31"
            });

        expect(res.status).toBe(403);
    });
});