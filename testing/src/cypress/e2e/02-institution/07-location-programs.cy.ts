import DashboardInstitutionObject, {
  CourseLoadCalculationOptions,
  CredentialTypes,
  DeliveredOnlineAlsoOnsiteOptions,
  EntranceRequirementsOptions,
  EslEligibilityOptions,
  HasInternationalExchangeOptions,
  HasInternationalExchangeProgramEligibilityOptions,
  HasTravelOptions,
  IncludeMinimum15InstructionalHours,
  IncludeMinimum20InstructionalHours,
  IsAviationProgram,
  JointInstitutionOptions as JointInstitutionPartnershipOptions,
  ProgramDeliveryOptions,
  ProgramIntensityOptions,
  ProgramLengthOptions,
  RegulatoryBodyOptions,
  TravelProgramEligibilityOptions,
  WILComponentOptions,
} from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import LocationProgramObject from "../../page-objects/Institution-objects/LocationProgramObject";
import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";
import ProgramDetailViewObject from "../../page-objects/Institution-objects/ProgramDetailViewObject";
import data from "../../e2e/data/institution/manage-location.json";

const dashboardInstitutionObject = new DashboardInstitutionObject();
const locationProgramObject = new LocationProgramObject();
const institutionHelperActions = new InstitutionHelperActions();
const programDetailViewObject = new ProgramDetailViewObject();

describe("Location Program", () => {
  // This will be replaced if necessary with the program created by the data seeds
  const existingProgram = "existingProgram";
  const nonExistingProgram = "nonExistingProgram";

  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
  });

  beforeEach(() => {
    dashboardInstitutionObject.homeButton().click();
    dashboardInstitutionObject.clickOnSideBar("Vancouver", "Programs");
  });

  it("Verify that user redirect to location program page", () => {
    dashboardInstitutionObject.institutionProgramsHeader().should("be.visible");
    cy.url().should("contain", "/location-programs");
  });

  it("Verify that user when searched for incorrect programs will return correct results", () => {
    dashboardInstitutionObject
      .institutionSearchInputBox()
      .type(nonExistingProgram)
      .type("{enter}");
    dashboardInstitutionObject.noProgramsYetText().should("be.visible");
  });

  it("Verify that user when searched for programs will display correct results", () => {
    dashboardInstitutionObject
      .institutionSearchInputBox()
      .type(existingProgram)
      .type("{enter}");
    dashboardInstitutionObject
      .institutionProgramName()
      .should("have.length", 2);
  });

  it("Verify that all programs are should have mandatory columns displayed", () => {
    dashboardInstitutionObject.institutionSearchInputBox().type("{enter}");
    dashboardInstitutionObject.institutionProgramName().should("be.visible");
    dashboardInstitutionObject
      .institutionProgramCIPInputText()
      .should("be.visible");
    dashboardInstitutionObject
      .institutionProgramCredential()
      .should("be.visible");
    dashboardInstitutionObject
      .institutionProgramStudyPeriods()
      .should("be.visible");
    dashboardInstitutionObject.institutionProgramStatus().should("be.visible");
  });

  it("Verify that user is able to view the detail of the program", () => {
    dashboardInstitutionObject
      .institutionSearchInputBox()
      .type(existingProgram)
      .type("{enter}");
    dashboardInstitutionObject.viewProgramButton().click();
    programDetailViewObject.programDetailHeader().should("be.visible");
    programDetailViewObject.programName().should("be.visible");
    programDetailViewObject.programCode().should("be.visible");
    programDetailViewObject.programCredentialType().should("be.visible");
    programDetailViewObject.programDescription().should("be.visible");
    programDetailViewObject.programNOCCode().should("be.visible");
    programDetailViewObject.programStatus().should("be.visible");
  });
});

describe("Location Program", () => {
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
  });

  beforeEach(() => {
    dashboardInstitutionObject.homeButton().click();
    dashboardInstitutionObject.clickOnSideBar("Vancouver", "Programs");
    dashboardInstitutionObject.createInstitutionProgram().click();
  });

  it("Verify that program name is a mandatory field", () => {
    dashboardInstitutionObject.verifyThatFieldShouldNotBeEmpty(
      dashboardInstitutionObject.institutionProgramName(),
      "Program name"
    );
  });

  it("Verify that program name should not accept more than 100 chars", () => {
    dashboardInstitutionObject.verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
      dashboardInstitutionObject.institutionProgramName(),
      "Program name",
      100
    );
  });

  it("Verify that CIP is a mandatory field", () => {
    dashboardInstitutionObject.verifyThatFieldShouldNotBeEmpty(
      dashboardInstitutionObject.institutionProgramName(),
      "Program name"
    );
  });

  it("Verify that CIP field only accepts the valid format", () => {
    data.invalidData.CIP.forEach((data) => {
      dashboardInstitutionObject
        .institutionProgramCIPInputText()
        .clear()
        .type(data);
      dashboardInstitutionObject.invalidFormatErrorText().should("be.visible");
    });
  });

  it("Verify that NOC field only accepts the valid format", () => {
    data.invalidData.NOC.forEach((data) => {
      dashboardInstitutionObject
        .institutionProgramCIPInputText()
        .clear()
        .type(data);
      dashboardInstitutionObject.invalidFormatErrorText().should("be.visible");
    });
  });

  it("Verify that SABC field only accepts the valid format", () => {
    data.invalidData.SABC.forEach((data) => {
      dashboardInstitutionObject
        .institutionProgramCIPInputText()
        .clear()
        .type(data);
      dashboardInstitutionObject.invalidFormatErrorText().should("be.visible");
    });
  });

  it("Verify that all credential types exist", () => {
    Object.values(CredentialTypes).forEach((credentialType) => {
      dashboardInstitutionObject.selectCredentialType(credentialType);
    });
  });

  it("Verify that without filling mandatory fields, proper error message must be displayed", () => {
    locationProgramObject.submitButton().click();
    locationProgramObject
      .percentageOfProgramESLErrorMessage()
      .should("be.visible");
    locationProgramObject
      .programOfferedJointlyErrorMessage()
      .should("be.visible");
    locationProgramObject
      .programWILComponentErrorMessage()
      .should("be.visible");
    locationProgramObject.fieldTripErrorMessage().should("be.visible");
    locationProgramObject
      .internationalExchangeErrorMessage()
      .should("be.visible");
    locationProgramObject.declarationErrorMessage().should("be.visible");
  });

  it("Verify that there are two options (yes and no) for program intensity question", () => {
    Object.values(ProgramIntensityOptions).forEach((option) => {
      dashboardInstitutionObject.studentPartTimeBasisRadioButton(option);
    });
  });

  it("Verify that there are two options (onsite and offsite) for program deliverability question", () => {
    Object.values(ProgramDeliveryOptions).forEach((option) => {
      dashboardInstitutionObject.deliverabilityOnsiteRadioButton(option);
    });
  });

  it("Verify that there are two options (yes and no) for program delivered 100% on site question", () => {
    dashboardInstitutionObject.deliverabilityOnsiteRadioButton(
      ProgramDeliveryOptions.Online
    );
    Object.values(DeliveredOnlineAlsoOnsiteOptions).forEach((option) => {
      dashboardInstitutionObject.deliveredOnlineAlsoRadioButton(option);
    });
  });

  it("Verify that there are two options (yes and no) for credits earned when course delivered on-site question", () => {
    dashboardInstitutionObject.deliverabilityOnsiteRadioButton(
      ProgramDeliveryOptions.Online
    );
    Object.values(DeliveredOnlineAlsoOnsiteOptions).forEach((option) => {
      dashboardInstitutionObject.deliveredOnlineAlsoRadioButton(option);
    });
  });

  it("Verify that all the options are available for program length dropdown", () => {
    Object.values(ProgramLengthOptions).forEach((option) => {
      dashboardInstitutionObject.selectProgramLength(option);
    });
  });

  it("Verify that there are two options (credit based and hours based) for program course load question", () => {
    Object.values(CourseLoadCalculationOptions).forEach((option) => {
      dashboardInstitutionObject.courseLoadCalculationRadioButton(option);
    });
  });

  it("Verify that there are two options (yes and no) for minimum instructional hours per week question is displayed", () => {
    dashboardInstitutionObject.courseLoadCalculationRadioButton(
      CourseLoadCalculationOptions.HoursBased
    );
    Object.values(IncludeMinimum20InstructionalHours).forEach((option) => {
      dashboardInstitutionObject.includeMinimum20InstructionalHoursRadioButton(
        option
      );
    });
  });

  it("Verify that there are two options (yes and no) for is Aviation program", () => {
    dashboardInstitutionObject.courseLoadCalculationRadioButton(
      CourseLoadCalculationOptions.HoursBased
    );
    dashboardInstitutionObject.includeMinimum20InstructionalHoursRadioButton(
      IncludeMinimum20InstructionalHours.No
    );
    Object.values(IsAviationProgram).forEach((option) => {
      dashboardInstitutionObject.isAviationProgramRadioButton(option);
    });
  });

  it("Verify that there are two options (yes and no) for minimum instructional hours for Aviation program", () => {
    dashboardInstitutionObject.courseLoadCalculationRadioButton(
      CourseLoadCalculationOptions.HoursBased
    );
    dashboardInstitutionObject.includeMinimum20InstructionalHoursRadioButton(
      IncludeMinimum20InstructionalHours.No
    );
    dashboardInstitutionObject.isAviationProgramRadioButton(
      IsAviationProgram.Yes
    );
    Object.values(IncludeMinimum15InstructionalHours).forEach((option) => {
      dashboardInstitutionObject.includeMinimum15InstructionalHoursRadioButton(
        option
      );
    });
  });

  it("Verify that all regulatory body options exist", () => {
    Object.values(RegulatoryBodyOptions).forEach((regulatoryBody) => {
      dashboardInstitutionObject.selectRegulatoryBody(regulatoryBody);
    });
  });

  it("Verify that all options are available for entrance requirement question", () => {
    Object.values(EntranceRequirementsOptions).forEach((option) => {
      dashboardInstitutionObject.entranceRequirementsRadioButton(option);
    });
  });

  it("Verify that two options (<20% and >20%) for ESL content question", () => {
    Object.values(EslEligibilityOptions).forEach((option) => {
      dashboardInstitutionObject.eslEligibilityRadioButton(option);
    });
  });

  it("Verify that two options (yes and no) for partnership with institution question", () => {
    Object.values(JointInstitutionPartnershipOptions).forEach((option) => {
      dashboardInstitutionObject.hasJointInstitutionRadioButton(option);
    });
  });

  it("Verify that two options (yes and no) for work integrated learning question", () => {
    dashboardInstitutionObject.hasJointInstitutionRadioButton(
      JointInstitutionPartnershipOptions.No
    );
    Object.values(WILComponentOptions).forEach((option) => {
      dashboardInstitutionObject.hasWILComponentRadioButton(option);
    });
  });

  it("Verify that two options (yes and no) for field trip question", () => {
    Object.values(HasTravelOptions).forEach((option) => {
      dashboardInstitutionObject.hasTravelRadioButton(option);
    });
  });

  it("Verify that two options (yes and no) for field trip travel eligibility question", () => {
    dashboardInstitutionObject.hasTravelRadioButton(HasTravelOptions.Yes);
    Object.values(TravelProgramEligibilityOptions).forEach((option) => {
      dashboardInstitutionObject.hasTravelEligibilityRadioButton(option);
    });
  });

  it("Verify that two options (yes and no) for international exchange question", () => {
    Object.values(HasInternationalExchangeOptions).forEach((option) => {
      dashboardInstitutionObject.hasInternationalExchangeRadioButton(option);
    });
  });

  it("Verify that two options (yes and no) for international exchange question", () => {
    dashboardInstitutionObject.hasInternationalExchangeRadioButton(
      HasInternationalExchangeOptions.Yes
    );
    Object.values(HasInternationalExchangeProgramEligibilityOptions).forEach(
      (option) => {
        dashboardInstitutionObject.hasInternationalExchangeEligibilityRadioButton(
          option
        );
      }
    );
  });
});
