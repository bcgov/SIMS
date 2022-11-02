import { DiscoveryService } from "@golevelup/nestjs-discovery";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { DATA_SEED, DATA_SEED_METHOD } from "./data-seed.decorator";
// ref: https://github.com/golevelup/nestjs/blob/master/packages/discovery/src/discovery.service.ts
@Injectable()
export class TestOrganizerService implements OnModuleInit {
  constructor(private readonly discoveryService: DiscoveryService) {}

  async onModuleInit(): Promise<void> {
    const discoveredClasses =
      await this.discoveryService.providersWithMetaAtKey<{
        name: string;
        order?: number;
      }>(DATA_SEED);
    console.log(discoveredClasses, "--before sort");
    // todo: ann sort and pass param and clean db
    // discoveredClasses.sort((a, b) => (a.meta.order < b.meta.order ? -1 : 1));

    console.log(discoveredClasses, "--after sort");
    for (const { discoveredClass } of discoveredClasses) {
      const methodMeta = this.discoveryService.classMethodsWithMetaAtKey(
        discoveredClass,
        DATA_SEED_METHOD,
      );
      // console.log(methodMeta);

      methodMeta.map((metadata) => {
        // Calling the decorated methods.
        metadata.discoveredMethod.handler.bind(
          metadata.discoveredMethod.parentClass.instance,
        )();
      });
    }
  }
}
