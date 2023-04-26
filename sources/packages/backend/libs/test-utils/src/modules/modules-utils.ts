import { DynamicModule, Type } from "@nestjs/common";
import { MODULE_METADATA } from "@nestjs/common/constants";
import { DiscoveryService } from "@golevelup/nestjs-discovery";
import { TestingModule } from "@nestjs/testing";

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

/**
 * Get the provider instance for a NestJS module.
 * When the same provider class is used for different modules,
 * there will be one instance for each module. When mocking
 * provider methods, it is important to get the instance for
 * the right module.
 * @param testingModule NestJS testing module.
 * @param module module class.
 * @param provider provider class.
 * @returns the provider instance for the given module.
 */
export async function getProviderInstanceForModule<T>(
  testingModule: TestingModule,
  module: Type,
  provider: Type<T>,
): Promise<T> {
  const discovery = testingModule.get(DiscoveryService);
  const providerResults = await discovery.providers((aProviderWith) => {
    return (
      aProviderWith.parentModule.instance instanceof module &&
      aProviderWith.instance instanceof provider
    );
  });
  const [providerResult] = providerResults;
  return providerResult.instance as T;
}
