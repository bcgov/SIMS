import { EducationProgramService } from "../services/EducationProgramService";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { useFormioUtils } from ".";

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
    offeringStartDateFieldId: string,
    offeringEndDateFieldId: string,
  ) => {
    const valueToBeLoaded =
      await EducationProgramOfferingService.shared.getProgramOfferingDetails(
        offeringId,
      );

    formioUtils.setComponentValue(
      form,
      offeringStartDateFieldId,
      valueToBeLoaded?.studyStartDate,
    );

    formioUtils.setComponentValue(
      form,
      offeringEndDateFieldId,
      valueToBeLoaded?.studyEndDate,
    );
  };

  /**
   * Get details of given offering by location and program
   * and populate form.io hidden fields.
   * @param form form to be updated with hidden field values.
   * @param offeringId offering.
   * @param offeringEndDateFieldId hidden field name in form.io.
   * @param locationId offering location.
   * @param programId offering program.
   */
  const loadSelectedOfferingDetailsByLocationAndProgram = async (
    form: any,
    offeringId: number,
    offeringEndDateFieldId: string,
    locationId: number,
    programId: number,
  ) => {
    const valueToBeLoaded =
      await EducationProgramOfferingService.shared.getOfferingDetailsByLocationAndProgram(
        locationId,
        programId,
        offeringId,
      );

    formioUtils.setComponentValue(
      form,
      offeringEndDateFieldId,
      valueToBeLoaded?.studyEndDate,
    );
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
    loadSelectedOfferingDetailsByLocationAndProgram,
  };
}
