import express from "express";
import cors from "cors";

import competitionRoutes from "./routes/competitionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import disciplineRoutes from "./routes/disciplineRoutes.js";
import ageCategoryRoutes from "./routes/ageCategoryRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import athleteRoutes from "./routes/athleteRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import entryRoutes from "./routes/entryRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());


app.use("/api/users", userRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/competitions", competitionRoutes);
app.use("/api/disciplines", disciplineRoutes);
app.use("/api/age-categories", ageCategoryRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/athletes", athleteRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/entries", entryRoutes);


export default app;