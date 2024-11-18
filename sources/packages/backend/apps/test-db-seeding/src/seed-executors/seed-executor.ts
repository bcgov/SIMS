import {
  DiscoveredClassWithMeta,
  DiscoveredMethodWithMeta,
  DiscoveryService,
} from "@golevelup/nestjs-discovery";
import { Injectable } from "@nestjs/common";
import {
  DATA_SEED,
  DATA_SEED_METHOD,
  DataSeedMethodOptions,
  DataSeedOptions,
  SeedPriorityOrder,
} from "./data-seed.decorator";
import { processInParallel } from "@sims/utilities";

interface ClassMethods {
  class: DiscoveredClassWithMeta<DataSeedOptions>;
  method: DiscoveredMethodWithMeta<DataSeedMethodOptions>;
}

@Injectable()
export class SeedExecutor {
  constructor(private readonly discoveryService: DiscoveryService) {}

  /**
   * Method execute the seeds, if the class names are provided, then it will only
   * execute only provided non skipped classes, else it will execute all
   * non skipped classes according to the priority order.
   * @param classesToBeSeeded is a optional parameter. It's the list of classes
   * to be seeded. If its not provided, the all classes will be seeded.
   */
  async executeSeed(classesToBeSeeded?: string[]): Promise<void> {
    // Get all class methods.
    const allMethodsWithMetaData =
      await this.getAllDiscoveredClassesAndMethods();

    let allMethodsToBeSeeded = allMethodsWithMetaData;

    // Filtering of certain provider class that need to executed
    // (which are passed as comma separated  parameter with the npm command).
    if (classesToBeSeeded?.length) {
      allMethodsToBeSeeded = [];
      classesToBeSeeded.forEach((classToBeSeeded) => {
        allMethodsToBeSeeded = allMethodsToBeSeeded.concat(
          allMethodsWithMetaData.filter(
            (eachClass) =>
              eachClass.class.discoveredClass.name === classToBeSeeded,
          ),
        );
      });
    }

    // Execute Priority order 1 methods after removing skipped classes and
    // skipped methods.
    await this.executeSeedMethods(
      allMethodsToBeSeeded,
      SeedPriorityOrder.Priority1,
    );

    // Execute other (priority order : unknown) methods after removing skipped
    // classes and skipped methods.
    await this.executeSeedMethods(allMethodsToBeSeeded);
  }

  /**
   * Method to get all discovered methods of the discovered classes.
   */
  private async getAllDiscoveredClassesAndMethods(): Promise<ClassMethods[]> {
    // Get discovered classes.
    const discoveredClasses =
      await this.discoveryService.providersWithMetaAtKey<DataSeedOptions>(
        DATA_SEED,
      );

    const allMetaData = [];

    discoveredClasses.forEach((discoveredClass) => {
      // Get the discovered methods of the discovered classes.
      const metaMethods =
        this.discoveryService.classMethodsWithMetaAtKey<DataSeedMethodOptions>(
          discoveredClass.discoveredClass,
          DATA_SEED_METHOD,
        );

      metaMethods.forEach((metaMethod) =>
        allMetaData.push({ class: discoveredClass, method: metaMethod }),
      );
    });

    return allMetaData;
  }

  /**
   * Executes seed methods as per the seed priority order, after
   * removing skipped classes and methods.
   * @param allMethodsToBeSeeded method array to be seeded.
   * @param order order that need to be seeded. If nothing is passed,
   * it will execute as seed priority "unknown".
   */
  private async executeSeedMethods(
    allMethodsToBeSeeded: ClassMethods[],
    order = SeedPriorityOrder.Unknown,
  ): Promise<void> {
    await processInParallel(async (method) => {
      if (
        method.class.meta.order === order &&
        !(method.class.meta.skip || method.method.meta.skip)
      ) {
        // Calling the decorated methods.
        await method.method.discoveredMethod.handler.bind(
          method.method.discoveredMethod.parentClass.instance,
        )();
      }
    }, allMethodsToBeSeeded);
  }
}
