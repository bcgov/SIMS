import { DataSource } from "typeorm";
import { RedisOptions } from "ioredis";
import { DBEntities, ormConfig, SequenceControl } from "@sims/sims-db";

describe("ORMQueryResultCache(e2e)-resilience", () => {
  let dataSource: DataSource;

  afterEach(async () => {
    if (!dataSource?.isInitialized) {
      return;
    }
    try {
      await dataSource.destroy();
    } catch {
      // The Redis client is deliberately unreachable in this test, so closing its
      // already-dead connection during teardown is expected to throw and can be ignored.
    }
  });

  it("Should execute a cached query successfully when the configured Redis cache backend is unreachable.", async () => {
    // Arrange
    // Points to a loopback port with nothing listening to simulate a Redis outage
    // (fails fast with ECONNREFUSED) while keeping the query result cache enabled.
    // no error is thrown because the cache is configured to ignore errors and fallback to the database.
    const unreachableRedisOptions: RedisOptions = {
      host: "127.0.0.1",
      port: 6390,
      commandTimeout: 500,
      retryStrategy: () => null,
    };
    dataSource = new DataSource({
      ...ormConfig,
      entities: DBEntities,
      cache: {
        type: "ioredis",
        options: unreachableRedisOptions,
        ignoreErrors: true,
        duration: 1000,
      },
    });
    await dataSource.initialize();
    // A uniquely named record avoids clashing with any pre-existing sequence data.
    const sequenceName = `orm-cache-resilience-test-${Date.now()}`;
    await dataSource
      .getRepository(SequenceControl)
      .save({ sequenceName, sequenceNumber: "1" });

    // Act
    const result = await dataSource.getRepository(SequenceControl).find({
      where: { sequenceName },
      cache: { id: "orm-cache-resilience-test", milliseconds: 1000 },
    });

    // Assert
    // The database query must resolve normally even though the cache backend
    // could never be reached, proving a Redis outage does not break the application.
    expect(result).toEqual([
      {
        sequenceName,
        sequenceNumber: "1",
        id: expect.any(Number),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    ]);
  });
});
