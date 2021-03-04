import { Injectable, Logger } from "@nestjs/common";
import { Request, Response } from "express";

@Injectable()
export class LoggerService extends Logger {
  static apiLogger(req: Request, res: Response, next: Function) {
    Logger.log(
      `Receive Request [${req.method}] From ${
        req.headers.origin ?? "unknown"
      } | ${req.headers["user-agent"]}`,
    );
    next();
  }
}
