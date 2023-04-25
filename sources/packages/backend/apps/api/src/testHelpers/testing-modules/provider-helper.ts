import { DiscoveryService } from "@golevelup/nestjs-discovery";
import { Type } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";

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
  module: Type<unknown>,
  provider: Type<T>,
) {
  const discovery = testingModule.get(DiscoveryService);
  const userServiceResults = await discovery.providers((aProviderWith) => {
    return (
      aProviderWith.parentModule.instance instanceof module &&
      aProviderWith.instance instanceof provider
    );
  });
  const [userServiceResult] = userServiceResults;
  return userServiceResult.instance as T;
}
