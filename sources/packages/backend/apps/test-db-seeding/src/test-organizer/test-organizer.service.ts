import {
  DiscoveredClassWithMeta,
  DiscoveryService,
} from "@golevelup/nestjs-discovery";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { DATA_SEED, DATA_SEED_METHOD } from "./data-seed.decorator";
@Injectable()
export class TestOrganizerService implements OnModuleInit {
  constructor(private readonly discoveryService: DiscoveryService) {}

  async onModuleInit(testServicesClasses?: string[]): Promise<void> {
    // Discovers all providers in the test-db-seeding app that have meta at a specific
    // key and returns the provider(s) and associated meta.
    const discoveredClasses =
      await this.discoveryService.providersWithMetaAtKey<{
        name: string;
        order?: number;
      }>(DATA_SEED);

    let classesToBeSeeded = discoveredClasses;
    // Filtering of certain provider class that need to executed (which are passed as comma separated  parameter with the npm command).
    if (testServicesClasses && testServicesClasses.length > 0) {
      classesToBeSeeded = [];
      testServicesClasses.forEach((testServicesClasses) => {
        classesToBeSeeded = classesToBeSeeded.concat(
          discoveredClasses.filter(
            (eachClass) =>
              eachClass.discoveredClass.name === testServicesClasses,
          ),
        );
      });
    }

    // todo: check if u are following wiki standards
    // TODO: UPDATE BELOW COMMAND
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

    sortedAndGroupedDiscoveredClassBatch.forEach(
      async (sortedAndGroupedDiscoveredClasses) => {
        let batchMethods = [];

        for (const { discoveredClass } of sortedAndGroupedDiscoveredClasses) {
          // Discovers all method handlers matching a particular metakey from the provider class.
          const methodMeta = this.discoveryService.classMethodsWithMetaAtKey<{
            name: string;
            order?: number;
          }>(discoveredClass, DATA_SEED_METHOD);
          // Merge all discovered provider methods in same class priority order.
          batchMethods = batchMethods.concat(methodMeta);
        }
        // Discovered provider methods of a class priority order are sorted with respect to
        // the priority order, if there is no priority order passed, it is considered as last.
        // eg,
        // [
        //   {
        //     meta: { name: "method", order: 1 },
        //     discoveredMethod: {
        //       handler: ["methodFromClass1"],
        //       methodName: "createPendingDesignationAgreement111",
        //       parentClass: [Object],
        //     },
        //   },
        //   {
        //     meta: { name: "method", order: 2 },
        //     discoveredMethod: {
        //       handler: ["methodFromClass2"],
        //       methodName: "createApprovalDesignationAgreement",
        //       parentClass: [Object],
        //     },
        //   },
        //   {
        //     meta: { name: "method", order: 3 },
        //     discoveredMethod: {
        //       handler: ["methodFromClass1"],
        //       methodName: "createPendingDesignationAgreement",
        //       parentClass: [Object],
        //     },
        //   },
        // ];
        batchMethods.sort((a, b) => (a.meta.order < b.meta.order ? -1 : 1));
        // Executing the  provider methods.
        const testMethods = batchMethods.map((metadata) =>
          // Calling the decorated methods.
          metadata.discoveredMethod.handler.bind(
            metadata.discoveredMethod.parentClass.instance,
          )(),
        );
        await Promise.all(testMethods);
      },
    );
  }

  sortAndGroup(
    discoveredClass: DiscoveredClassWithMeta<{
      name: string;
      order?: number;
    }>[],
  ): DiscoveredClassWithMeta<{
    name: string;
    order?: number;
  }>[][] {
    const result = discoveredClass
      .sort((a, b) => (a.meta.order < b.meta.order ? -1 : 1))
      .reduce((r, o) => {
        let temp = r.find(
          ([
            {
              meta: { order },
            },
          ]) => order === o.meta.order,
        );
        if (!temp) r.push((temp = []));
        temp.push(o);
        return r;
      }, []);
    return result;
  }
}
