import { DynamicModule, Type } from "@nestjs/common";
import { MODULE_METADATA } from "@nestjs/common/constants";

export type ModuleType = Type<unknown> | DynamicModule;
export type OverrideModuleInfo = {
  replace: ModuleType;
  by: ModuleType;
};

export function overrideImportsMetadata(
  rootModuleType: ModuleType,
  ...overrides: OverrideModuleInfo[]
) {
  const importsMetadata = Reflect.getMetadata(
    MODULE_METADATA.IMPORTS,
    rootModuleType,
  ) as unknown[];
  overrides.forEach((override) => overrideMetadata(importsMetadata, override));
}

function overrideMetadata(
  importsMetadata: unknown[],
  override: OverrideModuleInfo,
) {
  for (let i = 0; i < importsMetadata.length; i++) {
    const importMetadata = importsMetadata[i];
    if (
      importMetadata === override.replace ||
      (importMetadata as DynamicModule).module === override.replace
    ) {
      importsMetadata[i] = override.by;
      return;
    }
  }
  throw new Error("'Imports' metadata item was not found to be overridden.");
}
