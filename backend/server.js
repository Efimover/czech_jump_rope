import app from "./app.js";
import dotenv from "dotenv";
import healthRouter from "./tests/health.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

app.use("/api/health", healthRouter);


app.listen(PORT, () => console.log(`✅ Backend běží na portu ${PORT}`));