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

  /**
   * Get details of given offering and populate form.io
   * hidden fields.
   * @param form form to be updated with hidden field values.
   * @param offeringId offering.
   * @param offeringFieldIds hidden field names in form.io.
   * @param options API options to get offering details.
   */
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
        await EducationProgramOfferingService.shared.getProgramOfferingDetails(
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
