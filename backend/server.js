import dotenv from "dotenv";
dotenv.config({ path: "/app/.env" });

import app from "./app.js";

app.listen(3000, () => {
    console.log("Backend running on port 3000");
});