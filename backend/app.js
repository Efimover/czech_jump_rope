import express from "express";
import cors from "cors";

import competitionRoutes from "./routes/competitionRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/competitions", competitionRoutes);

export default app;
