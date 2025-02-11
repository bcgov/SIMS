import { Controller, Get } from "@nestjs/common";
import { Public } from "../../auth/decorators";
import { DataSource } from "typeorm";

@Controller("health")
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Returns a health check status.
   * @returns health check status.
   */
  @Get()
  @Public()
  getHello(): string {
    return this.getHeathCheckStatus();
  }

  /**
   * Get health check status.
   * @returns health check status.
   */
  private getHeathCheckStatus(): string {
    try {
      return `Hello World! The database dataSource is ${
        this.dataSource.isInitialized
      } and version: ${process.env.VERSION ?? "-1"}`;
    } catch (error: unknown) {
      return `Hello world! Fail with error: ${error}`;
    }
  }
}
