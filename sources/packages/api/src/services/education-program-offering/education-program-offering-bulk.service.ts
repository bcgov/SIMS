import { Injectable } from "@nestjs/common";
import {
  EducationProgram,
  EducationProgramOffering,
  InstitutionLocation,
  OfferingIntensity,
  OfferingStatus,
  OfferingTypes,
  ProgramIntensity,
  StudyBreak,
  StudyBreaksAndWeeks,
} from "../../database/entities";
import { RecordDataModelService } from "../../database/data.model.service";
import { DataSource } from "typeorm";
import { SaveOfferingModel } from "./education-program-offering-bulk.models";
import {
  isBoolean,
  isDate,
  isDateString,
  isEnum,
  isIn,
  isNotEmpty,
  max,
  maxLength,
  min,
} from "class-validator";
import {
  dateDifference,
  hasSomeIntersection,
  isBefore,
  isBetween,
  Period,
} from "../../utilities";

@Injectable()
export class EducationProgramOfferingBulkService extends RecordDataModelService<EducationProgramOffering> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(EducationProgramOffering));
  }

  async createOffering(
    offering: SaveOfferingModel,
  ): Promise<EducationProgramOffering> {
    const validationResults = this.validateInputModel(offering);

    const newOffering = new EducationProgramOffering();
    newOffering.name = offering.offeringName;
    newOffering.studyStartDate = offering.studyStartDate;
    newOffering.studyEndDate = offering.studyEndDate;
    newOffering.actualTuitionCosts = offering.actualTuitionCosts;
    newOffering.programRelatedCosts = offering.programRelatedCosts;
    newOffering.mandatoryFees = offering.mandatoryFees;
    newOffering.exceptionalExpenses = offering.exceptionalExpenses;
    newOffering.offeringDelivered = offering.offeringDelivered;
    newOffering.lacksStudyBreaks = offering.lacksStudyBreaks;
    newOffering.offeringType = OfferingTypes.Public;
    newOffering.educationProgram = {
      id: 1,
    } as EducationProgram;
    newOffering.institutionLocation = {
      id: 3,
    } as InstitutionLocation;
    newOffering.offeringIntensity = offering.offeringIntensity;
    newOffering.yearOfStudy = offering.yearOfStudy;
    newOffering.showYearOfStudy = offering.showYearOfStudy;
    newOffering.hasOfferingWILComponent = offering.hasOfferingWILComponent;
    newOffering.offeringWILType = offering.hasWILComponent;
    //newOffering.offeringDeclaration = offering.offeringDeclaration;
    newOffering.courseLoad = offering.courseLoad;
    newOffering.offeringStatus = OfferingStatus.Approved;

    newOffering.studyBreaks = this.getCalculateStudyBreaksAndWeeks(offering);
    newOffering.offeringDeclaration = true;

    return this.repo.save(newOffering);
  }

  private getCalculateStudyBreaksAndWeeks(
    offering: SaveOfferingModel,
  ): StudyBreaksAndWeeks {
    let sumOfTotalEligibleBreakDays = 0;
    let sumOfTotalIneligibleBreakDays = 0;
    const studyBreaks = offering.studyBreaks.map((eachBreak) => {
      const newStudyBreak = {} as StudyBreak;
      newStudyBreak.breakDays = dateDifference(
        eachBreak.breakEndDate,
        eachBreak.breakStartDate,
      );
      newStudyBreak.breakStartDate = eachBreak.breakStartDate;
      newStudyBreak.breakEndDate = eachBreak.breakEndDate;
      newStudyBreak.eligibleBreakDays = Math.min(newStudyBreak.breakDays, 21);
      newStudyBreak.ineligibleBreakDays =
        newStudyBreak.breakDays - newStudyBreak.eligibleBreakDays;
      sumOfTotalEligibleBreakDays += newStudyBreak.eligibleBreakDays;
      sumOfTotalIneligibleBreakDays += newStudyBreak.ineligibleBreakDays;
      return newStudyBreak;
    });

    // Offering total days.
    const totalDays = dateDifference(
      offering.studyEndDate,
      offering.studyStartDate,
    );

    // Allowable 10% total days.
    const allowable10Percentage = totalDays * 0.1;

    // Calculating the ineligible days
    const ineligibleDaysForFundingAfter10PercentageCalculation =
      sumOfTotalEligibleBreakDays - allowable10Percentage;

    const unfundedStudyPeriodDays =
      sumOfTotalIneligibleBreakDays +
      ineligibleDaysForFundingAfter10PercentageCalculation;

    const fundedStudyPeriodDays = Math.max(
      totalDays - unfundedStudyPeriodDays,
      0,
    );

    const studyBreaksAndWeeks = {} as StudyBreaksAndWeeks;
    studyBreaksAndWeeks.studyBreaks = studyBreaks;
    studyBreaksAndWeeks.totalDays = totalDays;
    studyBreaksAndWeeks.fundedStudyPeriodDays = fundedStudyPeriodDays;
    studyBreaksAndWeeks.unfundedStudyPeriodDays = unfundedStudyPeriodDays;
    return studyBreaksAndWeeks;
  }

  private validateInputModel(offering: SaveOfferingModel): string[] {
    const validationsMassages = [];
    // Name.
    if (!isNotEmpty(offering.offeringName)) {
      validationsMassages.push("Offering name is required.");
    }
    // Year of study.
    if (!min(offering.yearOfStudy, 1) && !max(offering.yearOfStudy, 9)) {
      validationsMassages.push("Year of study must be between 0 and 9.");
    }
    // Display this to students.
    if (!isBoolean(offering.showYearOfStudy)) {
      validationsMassages.push(
        "Show year of study is not in the expected format.",
      );
    }
    // How will this be offered?
    if (!isEnum(offering.offeringIntensity, OfferingIntensity)) {
      validationsMassages.push("Offering intensity has an unexpected value.");
    }

    // TODO: WARNING Program Offering Intensity Mismatch (Your program must have the correct program intensity to be able to select the offering intensity here.)

    // What is the course load for this offering?
    if (!min(offering.yearOfStudy, 20) && !max(offering.yearOfStudy, 59)) {
      validationsMassages.push("Course load must be between 20 and 59.");
    }
    // How will this offering be delivered?
    if (!isIn(offering.offeringDelivered, ["onsite", "online", "blended"])) {
      validationsMassages.push("Offering delivery has an unexpected value.");
    }

    // TODO: WARNING Program Offering Delivery Mismatch (Your program must have the correct delivery method(s) to be able to select the offering delivery here.)

    // Does this contain a work-integrated learning component?
    if (
      !isNotEmpty(offering.hasOfferingWILComponent) &&
      !maxLength(offering.hasOfferingWILComponent, 10)
    ) {
      validationsMassages.push(
        "Has offering WIL component must be provided and be less than 10 characters long.",
      );
    }

    // TODO: WANING Program Offering WIL Mismatch (Your program must be approved with a work-integrated component first).

    // What work-integrated learning type is contained within this study period????

    // Start date.
    if (
      !isDate(offering.studyStartDate) &&
      !isDateString(offering.studyStartDate)
    ) {
      validationsMassages.push("Study start is not a valid date.");
    }
    // End date.
    if (
      !isDate(offering.studyEndDate) &&
      !isDateString(offering.studyEndDate)
    ) {
      validationsMassages.push("Study end is not a valid date.");
    }
    // Start date and end date.
    if (!isBefore(offering.studyStartDate, offering.studyEndDate)) {
      validationsMassages.push(
        "Study end date must be greater than study start date.",
      );
    }
    // Breaks and weeks.
    if (!isBoolean(offering.lacksStudyBreaks)) {
      validationsMassages.push(
        "Lacks study breaks is not in the expected format.",
      );
    }
    if (offering.lacksStudyBreaks === true) {
      if (!offering.studyBreaks?.length) {
        validationsMassages.push(
          "Study breaks are required when 'Lacks study breaks' is true.",
        );
      } else {
        const hasEndDateBeforeStart = offering.studyBreaks.some(
          (studyBreak) =>
            !isBefore(studyBreak.breakStartDate, studyBreak.breakEndDate),
        );
        if (hasEndDateBeforeStart) {
          validationsMassages.push(
            "Study breaks start and end dates are not provided in the proper order.",
          );
        }
        // Check for overlaps.
        const periods = offering.studyBreaks.map(
          (studyBreak) =>
            ({
              startDate: studyBreak.breakStartDate,
              endDate: studyBreak.breakEndDate,
            } as Period),
        );
        if (hasSomeIntersection(periods)) {
          validationsMassages.push(
            "Study breaks have some periods overlapping.",
          );
        }
        offering.studyBreaks.some((studyBreak) => !isBetween());
      }
    }
    if (!min(offering.actualTuitionCosts, 0)) {
      validationsMassages.push(
        "Actual tuition costs must be equal to or greater than 0(zero).",
      );
    }
    if (!min(offering.programRelatedCosts, 0)) {
      validationsMassages.push(
        "Program related costs must be equal to or greater than 0(zero).",
      );
    }
    if (!min(offering.mandatoryFees, 0)) {
      validationsMassages.push(
        "Mandatory fees costs must be equal to or greater than 0(zero).",
      );
    }
    if (!min(offering.exceptionalExpenses, 0)) {
      validationsMassages.push(
        "Exceptional expenses must be equal to or greater than 0(zero).",
      );
    }
    if (!isEnum(offering.programIntensity, ProgramIntensity)) {
      validationsMassages.push("Program intensity has an unexpected value.");
    }
    if (!isBoolean(offering.programDeliveryTypes?.deliveredOnSite)) {
      validationsMassages.push(
        "Delivery type, delivered on site has an unexpected value.",
      );
    }
    if (!isBoolean(offering.programDeliveryTypes?.deliveredOnline)) {
      validationsMassages.push(
        "Delivery type, delivered online has an unexpected value.",
      );
    }
    if (!isIn(offering.hasWILComponent, ["no"])) {
      validationsMassages.push("Has WIL component has an unexpected value.");
    }
    return validationsMassages;
  }
}
