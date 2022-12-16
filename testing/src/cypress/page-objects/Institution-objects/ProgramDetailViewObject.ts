import BaseMethods from "./BaseMethods";

export default class ProgramDetailViewObject extends BaseMethods {
  programName() {
    return this.getElementByCyId("programName");
  }

  programStatus() {
    return this.getElementByCyId("programStatus");
  }

  editButton() {
    return this.getElementByCyId("programEditButton");
  }

  programDescription() {
    return this.getElementByCyId("programDescription");
  }

  programCredentialType() {
    return this.getElementByCyId("programCredential");
  }

  programCIP() {
    return this.getElementByCyId("programCIP");
  }

  programNOCCode() {
    return this.getElementByCyId("programNOCCode");
  }

  programCode() {
    return this.getElementByCyId("programCode");
  }

  programDetailHeader() {
    return this.getElementByCyId("programDetailHeader");
  }

  offeringSearchBox() {
    return this.getElementByCyId("searchBox");
  }

  addOfferingButton() {
    return this.getElementByCyId("addNewOfferingButton");
  }
}
