import express from "express";
import cookieParser from "cookie-parser";

import cors from "cors";

import competitionRoutes from "./routes/competitionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import disciplineRoutes from "./routes/disciplineRoutes.js";
import ageCategoryRoutes from "./routes/ageCategoryRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import athleteRoutes from "./routes/athleteRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import entryRoutes from "./routes/entryRoutes.js";
import refereeRoutes from "./routes/refereeRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();

app.use(cors({
    origin: "http://localhost:5174", // frontend
    credentials: true
}));
app.use(express.json());

app.use(cookieParser());
app.use("/api/users", userRoutes);
app.use("/api/competitions", competitionRoutes);
app.use("/api/disciplines", disciplineRoutes);
app.use("/api/age-categories", ageCategoryRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/athletes", athleteRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/referees", refereeRoutes);
app.use("/api/registrations", auditLogRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((err, req, res, next) => {
    console.error("🔥 UNHANDLED ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
});

export default app;



