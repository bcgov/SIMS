import { SetMetadata } from "@nestjs/common";

// metaDataKey for the provider class.
export const DATA_SEED = Symbol.for("DATA_SEED");
// metaDataKey for the provider method.
export const DATA_SEED_METHOD = Symbol.for("DATA_SEED_METHOD");

// Seed priority order.
export enum SeedPriorityOrder {
  FirstBatch = 1,
  SecondBach = 2,
  LastBatch = 3,
}

/**
 * Decorator for data seed provider classes.
 * If a class is not decorated with this decorator,
 * then it will not be considered for seeding.
 * @param name name of the decorator.
 * @param order order of the class.
 * If nothing is not passed, its considered as last batch.
 */
export const DataSeed = (
  name: string,
  order = SeedPriorityOrder.LastBatch,
): ClassDecorator => SetMetadata(DATA_SEED, { name, order });

/**
 * Decorator for data seed methods.
 * If a method is not decorated with this decorator,
 * then it will not be considered for seeding.
 * @param name name of the decorator.
 * @param order order of the method.
 * If nothing is not passed, its considered as last batch.
 */
export const DataSeedMethod = (
  name: string,
  order = SeedPriorityOrder.LastBatch,
): MethodDecorator => SetMetadata(DATA_SEED_METHOD, { name, order });
