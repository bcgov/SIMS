import { SetMetadata } from "@nestjs/common";

export const DATA_SEED = Symbol.for("DATA_SEED");
export const DATA_SEED_METHOD = Symbol.for("DATA_SEED_METHOD");
export enum SeedPriorityOrder {
  One = 1,
  Two = 2,
  Three = 3,
}

// todo ann add comment to all function
export const DataSeedMethod = (
  name: string,
  order?: SeedPriorityOrder,
): MethodDecorator => SetMetadata(DATA_SEED_METHOD, { name, order });

// todo ann add comment
export const DataSeed = (
  name: string,
  order?: SeedPriorityOrder,
): ClassDecorator => SetMetadata(DATA_SEED, { name, order });
