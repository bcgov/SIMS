import { ArgumentsHost, UnauthorizedException } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { LoggerService } from "@sims/utilities/logger";
import { AppAllExceptionsFilter } from "./app.exception.filter";

describe("AppAllExceptionsFilter", () => {
  let filter: AppAllExceptionsFilter;
  let logger: jest.Mocked<Pick<LoggerService, "warn" | "error">>;
  let baseCatchSpy: jest.SpyInstance;
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ path: "/audit" }),
    }),
  } as ArgumentsHost;

  beforeEach(() => {
    logger = { warn: jest.fn(), error: jest.fn() };
    filter = new AppAllExceptionsFilter(logger as unknown as LoggerService);
    baseCatchSpy = jest
      .spyOn(BaseExceptionFilter.prototype, "catch")
      .mockImplementation();
  });

  afterEach(() => {
    baseCatchSpy.mockRestore();
  });

  it("Should not log the UnauthorizedException as an error when the request is unauthorized.", () => {
    // Arrange
    const exception = new UnauthorizedException();

    // Act
    filter.catch(exception, host);

    // Assert
    expect(logger.error).not.toHaveBeenCalled();
    expect(baseCatchSpy).toHaveBeenCalledWith(exception, host);
  });

  it("Should log an unhandled exception when the exception is not an HTTP exception.", () => {
    // Arrange
    const exception = new Error("Unexpected error.");

    // Act
    filter.catch(exception, host);

    // Assert
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "Unhandled exception | Request path: /audit | User: not authenticated",
      exception,
    );
  });
});
