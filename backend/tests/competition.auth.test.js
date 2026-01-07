import request from "supertest";
import app from "../app.js";

describe("Competition auth", () => {
    it("rejects unauthenticated user", async () => {
        const res = await request(app)
            .post("/api/competitions")
            .send({ name: "Test Cup" });

        expect(res.status).toBe(401);
    });
});