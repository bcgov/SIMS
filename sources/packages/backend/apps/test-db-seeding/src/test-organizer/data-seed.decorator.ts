import { SetMetadata } from "@nestjs/common";

// metaDataKey for the provider class.
export const DATA_SEED = Symbol.for("DATA_SEED");
// metaDataKey for the provider method.
export const DATA_SEED_METHOD = Symbol.for("DATA_SEED_METHOD");

// Seed priority order.
export enum SeedPriorityOrder {
  FirstBatch = 1,
  LastBatch = 2,
}

/**
 * Decorator for data seed provider classes.
 * If a class is not decorated with this decorator,
 * then it will not be considered for seeding.
 * @param name name of the decorator.
 * @param order order of the class.
 * If nothing is not passed, its considered as last batch.
 * @param skip default is false, if
 * any class needs to be skip while seeding pass true.
 */
export const DataSeed = (
  name: string,
  order = SeedPriorityOrder.LastBatch,
  skip = false,
): ClassDecorator => SetMetadata(DATA_SEED, { name, order, skip });

/**
 * Decorator for data seed methods.
 * If a method is not decorated with this decorator,
 * then it will not be considered for seeding.
 * @param name name of the decorator.
 * @param skip default is false, if
 * any method needs to be skip while seeding pass true.

 */
export const DataSeedMethod = (name: string, skip = false): MethodDecorator =>
  SetMetadata(DATA_SEED_METHOD, { name, skip });
