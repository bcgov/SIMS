import { Injectable, ConsoleLogger, Scope } from "@nestjs/common";

/**
 * Common log across entire solution.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {}
