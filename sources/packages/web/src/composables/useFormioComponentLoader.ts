import { EducationProgramService } from "../services/EducationProgramService";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { useFormioUtils } from ".";
import {
  EducationProgramOfferingAPIOutDTO,
  OfferingStartDateAPIOutDTO,
} from "@/services/http/dto";

/**
 * Common methods to load components data on Form.IO that could
 * be reusable or at least simplify the form data load logic.
 * @returns Methods to help loading the data into Form.IO forms.
 */
export function useFormioComponentLoader() {
  const formioUtils = useFormioUtils();
  // Get offering date of the selected offering and set to the hidden field (selectedOfferingDate) in formio.
  const loadSelectedOfferingDetails = async (
    form: any,
    offeringId: number,
    offeringFieldIds: {
      offeringEndDateFieldId: string;
      offeringStartDateFieldId?: string;
    },
    options?: { locationId: number; programId: number },
  ) => {
    let valueToBeLoaded:
      | OfferingStartDateAPIOutDTO
      | EducationProgramOfferingAPIOutDTO;

    if (options) {
      valueToBeLoaded =
        await EducationProgramOfferingService.shared.getOfferingDetailsByLocationAndProgram(
          options.locationId,
          options.programId,
          offeringId,
        );
    } else {
      valueToBeLoaded =
        await EducationProgramOfferingService.shared.getProgramOfferingDates(
          offeringId,
        );
    }

    formioUtils.setComponentValue(
      form,
      offeringFieldIds.offeringEndDateFieldId,
      valueToBeLoaded?.studyEndDate,
    );

    if (offeringFieldIds.offeringStartDateFieldId) {
      formioUtils.setComponentValue(
        form,
        offeringFieldIds.offeringStartDateFieldId,
        valueToBeLoaded?.studyStartDate,
      );
    }
  };

  // Get Program description for the selected program and set to the field (programDesc) in formio.
  const loadProgramDesc = async (
    form: any,
    programId: number,
    fieldId: string,
  ) => {
    const valueToBeLoaded =
      await EducationProgramService.shared.getStudentEducationProgram(
        programId,
      );
    formioUtils.setComponentValue(form, fieldId, valueToBeLoaded);
  };

  return {
    loadProgramDesc,
    loadSelectedOfferingDetails,
  };
}
