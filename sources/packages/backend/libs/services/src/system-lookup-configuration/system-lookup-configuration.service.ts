import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SystemLookupCategory, SystemLookupConfiguration } from "@sims/sims-db";
import { Repository } from "typeorm";

/**
 * System lookup configuration service.
 */
@Injectable()
export class SystemLookupConfigurationService {
  /**
   * @private All system lookup configurations map by lookup category.
   */
  private systemLookupConfigurationsMap = new Map<
    SystemLookupCategory,
    ReadonlyArray<SystemLookupConfiguration>
  >();
  constructor(
    @InjectRepository(SystemLookupConfiguration)
    private readonly systemLookupConfigurationRepo: Repository<SystemLookupConfiguration>,
  ) {}

  /**
   * Load all system lookup configurations.
   */
  async loadAllSystemLookupConfigurations(): Promise<void> {
    const lookupItems = await this.systemLookupConfigurationRepo.find({
      select: {
        id: true,
        lookupCategory: true,
        lookupKey: true,
        lookupValue: true,
      },
    });
    this.systemLookupConfigurationsMap = lookupItems.reduce(
      (lookupMap, item) => {
        const categoryLookupEntries = lookupMap.get(item.lookupCategory) ?? [];
        categoryLookupEntries.push(Object.freeze(item));
        lookupMap.set(item.lookupCategory, categoryLookupEntries);
        return lookupMap;
      },
      new Map<SystemLookupCategory, SystemLookupConfiguration[]>(),
    );
  }

  /**
   * Get system lookup by category.
   * @param lookupCategory lookup category.
   * @returns system lookup for the lookup category.
   */
  getLookupByCategory(
    lookupCategory: SystemLookupCategory,
  ): ReadonlyArray<SystemLookupConfiguration> {
    return this.systemLookupConfigurationsMap.get(lookupCategory) ?? [];
  }
}
