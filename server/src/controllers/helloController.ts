import { Request, Response } from "express";
import { getHelloMessage } from "../models/helloModel";

export const sayHello = (_req: Request, res: Response) => {
  const message = getHelloMessage();
  res.status(200).json({ message });
};
