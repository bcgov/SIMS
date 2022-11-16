import {
  DiscoveredClassWithMeta,
  DiscoveryService,
} from "@golevelup/nestjs-discovery";
import { Injectable } from "@nestjs/common";
import {
  DATA_SEED,
  DATA_SEED_METHOD,
  MethodInterface,
  ProviderInterface,
} from "./data-seed.decorator";

@Injectable()
export class SeedExecutor {
  constructor(private readonly discoveryService: DiscoveryService) {}

  /**
   * Method execute the seeds, if the class names are provided, then it will only
   * execute only provided non skipped classes, else it will execute all
   * non skipped classes according to the priority order.
   * @param classToBeSeeded is a optional parameter. it the list of classes
   * to be seeded. if its not provided, the all classes will be seeded.
   */
  async executeSeed(classToBeSeeded?: string[]): Promise<void> {
    // Discovers all providers in the test-db-seeding app that have meta at a specific
    // key and returns the provider(s) and associated meta.
    const discoveredClasses =
      await this.discoveryService.providersWithMetaAtKey<ProviderInterface>(
        DATA_SEED,
      );

    // Remove skipped classes.
    let classesToBeSeeded = discoveredClasses.filter(
      (eachClass) => !eachClass.meta.skip,
    );
    // Filtering of certain provider class that need to executed (which are passed as comma separated  parameter with the npm command).
    if (classToBeSeeded && classToBeSeeded.length > 0) {
      classesToBeSeeded = [];
      classToBeSeeded.forEach((classToBeSeeded) => {
        classesToBeSeeded = classesToBeSeeded.concat(
          discoveredClasses.filter(
            (eachClass) =>
              eachClass.discoveredClass.name === classToBeSeeded &&
              !eachClass.meta.skip,
          ),
        );
      });
    }
    // Discovered provider class are sorted and grouped with respect to
    // the priority order of the class, if there is no priority order passed, it is considered as last.
    // eg,
    // [
    //   [
    //     { meta: { order: 1, name: "provider" }, discoveredMethod: {...} },
    //     { meta: { order: 1, name: "provider" }, discoveredMethod: {...} },
    //   ],
    //   [{ meta: { order: 2, name: "provider" }, discoveredMethod: {...} }],
    // ];
    const sortedAndGroupedDiscoveredClassBatch =
      this.sortAndGroup(classesToBeSeeded);

    for (const sortedAndGroupedDiscoveredClasses of sortedAndGroupedDiscoveredClassBatch) {
      let testMethods = [];

      sortedAndGroupedDiscoveredClasses.forEach((discoveredClasses) => {
        // Discovers all method handlers matching a particular metakey from the provider class.
        const metMethods =
          this.discoveryService.classMethodsWithMetaAtKey<MethodInterface>(
            discoveredClasses.discoveredClass,
            DATA_SEED_METHOD,
          );

        // Remove skipped methods.
        const methodsToBeSeeded = metMethods.filter(
          (eachMethod) => !eachMethod.meta.skip,
        );

        testMethods = testMethods.concat(
          methodsToBeSeeded.map((metadata) =>
            // Calling the decorated methods.
            metadata.discoveredMethod.handler.bind(
              metadata.discoveredMethod.parentClass.instance,
            )(),
          ),
        );
      });
      await Promise.all(testMethods);
    }
  }
  private sortAndGroup(
    discoveredClass: DiscoveredClassWithMeta<ProviderInterface>[],
  ): DiscoveredClassWithMeta<{
    name: string;
    order?: number;
  }>[][] {
    discoveredClass.sort((a, b) => (a.meta.order < b.meta.order ? -1 : 1));

    return discoveredClass.reduce((r, o) => {
      let temp = r.find(
        ([
          {
            meta: { order },
          },
        ]) => order === o.meta.order,
      );
      if (!temp) {
        temp = [];
        r.push(temp);
      }
      temp.push(o);
      return r;
    }, []);
  }
}
