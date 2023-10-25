import { FormYesNoOptions, RelationshipStatus } from "@sims/sims-db";
import { IER12WorkflowData } from "./data-inputs.models";

export const WORKFLOW_DATA_SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS: IER12WorkflowData =
  {
    studentData: {
      dependantStatus: "independant",
      relationshipStatus: RelationshipStatus.Single,
      livingWithParents: FormYesNoOptions.No,
      numberOfParents: undefined,
    },
    calculatedData: {
      parentalAssets: undefined,
      studentMaritalStatusCode: "SI",
      totalEligibleDependents: undefined,
      familySize: 1,
      parentalAssetContribution: undefined,
      parentalContribution: undefined,
      parentDiscretionaryIncome: undefined,
      dependantTotalMSOLAllowance: undefined,
      studentMSOLAllowance: 7777,
      totalChildCareCost: undefined,
      totalNonEducationalCost: 22,
      dependantChildQuantity: undefined,
      dependantChildInDaycareQuantity: undefined,
      dependantInfantQuantity: undefined,
      dependantDeclaredOnTaxesQuantity: undefined,
      dependantPostSecondaryQuantity: undefined,
      partnerStudentStudyWeeks: undefined,
    },
  };

export const WORKFLOW_DATA_MARRIED_WITH_DEPENDENTS: IER12WorkflowData = {
  studentData: {
    dependantStatus: "independant",
    relationshipStatus: RelationshipStatus.Married,
    livingWithParents: FormYesNoOptions.No,
    numberOfParents: undefined,
  },
  calculatedData: {
    parentalAssets: undefined,
    studentMaritalStatusCode: "MA",
    totalEligibleDependents: 3,
    familySize: 5,
    parentalAssetContribution: undefined,
    parentalContribution: undefined,
    parentDiscretionaryIncome: undefined,
    dependantTotalMSOLAllowance: undefined,
    studentMSOLAllowance: 7777,
    totalChildCareCost: 3000,
    totalNonEducationalCost: 500,
    dependantChildQuantity: 3,
    dependantChildInDaycareQuantity: 2,
    dependantInfantQuantity: 1,
    dependantDeclaredOnTaxesQuantity: 3,
    dependantPostSecondaryQuantity: 0,
    partnerStudentStudyWeeks: 99,
  },
};

export const WORKFLOW_DATA_DEPENDANT_RELATIONSHIP_OTHER_LIVING_WITH_PARENTS: IER12WorkflowData =
  {
    studentData: {
      dependantStatus: "dependant",
      relationshipStatus: RelationshipStatus.Other,
      livingWithParents: FormYesNoOptions.Yes,
      numberOfParents: 2,
    },
    calculatedData: {
      parentalAssets: 142.97,
      studentMaritalStatusCode: "SI",
      totalEligibleDependents: undefined,
      familySize: 3,
      parentalAssetContribution: 97,
      parentalContribution: 50.9,
      parentDiscretionaryIncome: 145.5,
      dependantTotalMSOLAllowance: 1212.98,
      studentMSOLAllowance: 7777,
      totalChildCareCost: undefined,
      totalNonEducationalCost: 500.99,
      dependantChildQuantity: undefined,
      dependantChildInDaycareQuantity: undefined,
      dependantInfantQuantity: undefined,
      dependantDeclaredOnTaxesQuantity: undefined,
      dependantPostSecondaryQuantity: undefined,
      partnerStudentStudyWeeks: undefined,
    },
  };
