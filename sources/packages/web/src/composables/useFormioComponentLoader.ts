import { EducationProgramService } from "../services/EducationProgramService";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { useFormioUtils } from ".";
import { FormIOForm } from "@/types";
import { RestrictionService } from "@/services/RestrictionService";

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

  /**
   * Load institution restrictions for the given location and program
   * to the provided form.io component.
   * @param form form to update the component.
   * @param locationId location.
   * @param programId program.
   * @param formIOComponentKey form.io component key.
   */
  const loadInstitutionRestrictions = async (
    form: FormIOForm,
    locationId: number,
    programId: number,
    formIOComponentKey: string,
  ): Promise<void> => {
    const institutionRestrictions =
      await RestrictionService.shared.getLocationProgramInstitutionRestrictions(
        locationId,
        programId,
      );
    const componentValue = institutionRestrictions.institutionRestrictions;
    formioUtils.setComponentValue(form, formIOComponentKey, componentValue);
  };

  return {
    loadProgramDesc,
    loadSelectedOfferingDetails,
    loadSelectedOfferingDetailsByLocationAndProgram,
    loadInstitutionRestrictions,
  };
}
