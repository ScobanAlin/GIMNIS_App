import "dotenv/config";
import express from "express";

import competitorRoutes from "./routes/competitorRoutes";
import judgeRoutes from "./routes/judgeRoutes";
import scoreRoutes from "./routes/scoreRoutes";
import voteRoutes from "./routes/voteRoutes";
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// register routes
app.use("/api", competitorRoutes);
app.use("/api", judgeRoutes);
app.use("/api", scoreRoutes);
app.use("/api", voteRoutes);



app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default app;