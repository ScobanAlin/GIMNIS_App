import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

const helloRoutes = require("./routes/helloRoutes").default;


app.use(express.json());

app.use("/api", helloRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default app