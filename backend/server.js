import dotenv from "dotenv";
dotenv.config({ path: "/app/.env" });

import app from "./app.js";

app.listen(process.env.PORT || 3000, () => {
    console.log("Backend running on port", process.env.PORT || 3000);
});