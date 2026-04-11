import { Global, Module } from "@nestjs/common";
import { FeatureToggles } from "./feature-toggles";

@Global()
@Module({
  providers: [FeatureToggles],
  exports: [FeatureToggles],
})
export class FeatureTogglesModule {}
