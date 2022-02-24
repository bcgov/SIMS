import { Injectable, Logger, ConsoleLogger } from "@nestjs/common";
import { Request, Response } from "express";

@Injectable()
export class LoggerService extends ConsoleLogger {
  static apiLogger(req: Request, res: Response, next: Function) {
    Logger.log(
      `Receive Request {METHOD: [${req.method}]} | {PATH: [${req.path}]} From ${
        req.headers.origin ?? "unknown"
      } | ${req.headers["user-agent"] || "unknown"}`,
    );
    next();
  }
}
