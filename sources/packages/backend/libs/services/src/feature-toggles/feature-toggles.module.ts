import { Global, Module } from "@nestjs/common";
import { FeatureTogglesService } from "./feature-toggles";

@Global()
@Module({
  providers: [FeatureTogglesService],
  exports: [FeatureTogglesService],
})
export class FeatureTogglesModule {}
