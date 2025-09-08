import "dotenv/config";
import express from "express";

import competitorRoutes from "./routes/competitorRoutes";
import judgeRoutes from "./routes/judgeRoutes";
import scoreRoutes from "./routes/scoreRoutes";
import voteRoutes from "./routes/voteRoutes";
import rankingRoutes from "./routes/rankingRoutes";

import path from "path";




const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));


// register routes
app.use("/api", competitorRoutes);
app.use("/api", judgeRoutes);
app.use("/api", scoreRoutes);
app.use("/api", voteRoutes);
app.use("/api", rankingRoutes);


app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default app;