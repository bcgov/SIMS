import { ApplicationDisabilityStatus, RelationshipStatus } from "@sims/sims-db";
import { YesNoOptions } from "@sims/test-utils";

export const APPLICATION_DATA_SINGLE_INDEPENDENT = {
  workflowName: "assessment-gateway",
  dependantstatus: "independant",
  relationshipStatus: RelationshipStatus.Single,
  taxReturnIncome: 40000,
  whenDidYouGraduateOrLeaveHighSchool: "2017-03-01",
  indigenousStatus: YesNoOptions.No,
  hasDependents: YesNoOptions.No,
  livingWithParents: YesNoOptions.No,
  youthInCare: YesNoOptions.No,
  applicationPDPPDStatus: YesNoOptions.No,
  selectedOffering: null,
};
