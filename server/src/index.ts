import "dotenv/config";
import express from "express";

const db = require("./db");                         // ok (your db module.exports = pool)
const competitorRoutes = require("./routes/competitorRoutes"); // ok (your routes module.exports = router)

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

app.use("/api", competitorRoutes); 

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default app;