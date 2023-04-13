import { DynamicModule, Type } from "@nestjs/common";
import { MODULE_METADATA } from "@nestjs/common/constants";

/**
 * Nestjs module types that can be overwritten.
 */
export type ModuleType = Type<unknown> | DynamicModule;
/**
 * Information needed to find and have a module overwritten.
 */
export type OverrideModuleInfo = {
  /**
   * Current module to be found and replaced.
   */
  replace: ModuleType;
  /**
   * Module to replace the existing one.
   */
  by: ModuleType;
};

/**
 * Find modules and replace them with the provided ones.
 * So far Nestjs does not provide an out-of-box way to override an entire
 * module. This is considered a work around and should only be used under
 * specific circumstances. Before using this method please ensure that
 * the override provider option cannot be used instead.
 * @param rootModuleType module to have the 'imports' overwritten.
 * @param overrides information to find and replace modules.
 */
export function overrideImportsMetadata(
  rootModuleType: Type<unknown> | DynamicModule,
  ...overrides: OverrideModuleInfo[]
) {
  const importsMetadata = Reflect.getMetadata(
    MODULE_METADATA.IMPORTS,
    rootModuleType,
  ) as unknown[];
  overrides.forEach((override) => overrideMetadata(importsMetadata, override));
}

/**
 * Find a module and replace it for the provided one.
 * @param importsMetadata information from all the 'imports' metadata where
 * the module must be found and replaced.
 * @param override information to find and replace the module.
 */
function overrideMetadata(
  importsMetadata: unknown[],
  override: OverrideModuleInfo,
): void {
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
  throw new Error(
    `The '${MODULE_METADATA.IMPORTS}' metadata item was not found to be overwritten.`,
  );
}
