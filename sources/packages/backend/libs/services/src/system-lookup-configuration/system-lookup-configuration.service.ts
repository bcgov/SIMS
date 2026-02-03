import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SystemLookupCategory, SystemLookupConfiguration } from "@sims/sims-db";
import { Repository } from "typeorm";

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
    private systemLookupConfigurationRepo: Repository<SystemLookupConfiguration>,
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
    for (const item of lookupItems) {
      const category = item.lookupCategory;
      const existing = this.systemLookupConfigurationsMap.get(category) ?? [];
      this.systemLookupConfigurationsMap.set(category, [
        ...existing,
        Object.freeze(item),
      ]);
    }
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
