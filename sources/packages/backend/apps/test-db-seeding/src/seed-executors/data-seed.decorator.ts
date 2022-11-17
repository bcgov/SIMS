import { SetMetadata } from "@nestjs/common";

// metaDataKey for the provider class.
export const DATA_SEED = Symbol.for("DATA_SEED");
// metaDataKey for the provider method.
export const DATA_SEED_METHOD = Symbol.for("DATA_SEED_METHOD");

// Seed priority order.
export enum SeedPriorityOrder {
  Priority1 = 1,
  Unknown = Number.MAX_SAFE_INTEGER,
}

/**
 * Provided interface.
 */
export interface DataSeedOptions {
  order?: number;
  skip?: boolean;
}

/**
 * Method interface.
 */
export interface DataSeedMethodOptions {
  skip?: boolean;
}

/**
 * Decorator for data seed provider classes.
 * If a class is not decorated with this decorator,
 * then it will not be considered for seeding.
 * @param options options for the decorator.
 * @options [order] order of the class.
 * If nothing is not passed, its considered as last batch.
 * @options [skip] default is false, if
 * any class needs to be skip while seeding pass true.
 */
export const DataSeed = (options?: DataSeedOptions): ClassDecorator => {
  const newOptions: DataSeedOptions = {
    order: options?.order ?? SeedPriorityOrder.Unknown,
    skip: options?.skip ?? false,
  };
  return SetMetadata(DATA_SEED, newOptions);
};

/**
 * Decorator for data seed methods.
 * If a method is not decorated with this decorator,
 * then it will not be considered for seeding.
 * @param options options for the decorator.
 * @options [skip] default is false, if
 * any method needs to be skipped while seeding pass true.
 */
export const DataSeedMethod = (
  options?: DataSeedMethodOptions,
): MethodDecorator => {
  const newOptions: DataSeedMethodOptions = {
    skip: options?.skip ?? false,
  };
  return SetMetadata(DATA_SEED_METHOD, newOptions);
};
