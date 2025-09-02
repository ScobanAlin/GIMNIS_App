import { Router } from "express";
import { sayHello } from "../controllers/helloController";

const router = Router();
router.get("/hello", sayHello);

export default router; // <-- default export