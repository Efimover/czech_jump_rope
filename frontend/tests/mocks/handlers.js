import { http, HttpResponse } from "msw";
export const handlers = [
    http.get("/api/competitions/:id", () =>
        HttpResponse.json({
            competition_id: 1,
            name: "Test Cup",
            description: "Test description",
            start_date: "2026-01-01",
            end_date: "2026-01-02",
            reg_start: "2025-12-01",
            reg_end: "2025-12-20",
            owner_id: 1
        })
    ),

    http.get("/api/competitions/:id/disciplines", () =>
        HttpResponse.json([])
    ),

    http.get("/api/referees", () =>
        HttpResponse.json([])
    )
];