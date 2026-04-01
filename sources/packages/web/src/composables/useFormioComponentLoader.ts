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
   * If the component doesn't exist in the form, it means the form doesn't support
   * location program institution restrictions.
   * The feature should be available for 2025-26 program year and later.
   * @param form Form to update the component.
   * @param locationId Location.
   * @param programId Program.
   * @param formIOComponentKey Form.io component key.
   */
  const loadSelectedLocationProgramRestrictions = async (
    form: FormIOForm,
    locationId: number,
    programId: number,
    formIOComponentKey: string,
  ): Promise<void> => {
    const component = formioUtils.getComponent(form, formIOComponentKey);
    if (!component) {
      // If the component doesn't exist, it means the form doesn't support
      // location program institution restrictions.
      return;
    }
    const institutionRestrictions =
      await RestrictionService.shared.getLocationProgramInstitutionRestrictions(
        locationId,
        programId,
      );
    component.setValue(institutionRestrictions.institutionRestrictions);
  };

  return {
    loadProgramDesc,
    loadSelectedOfferingDetails,
    loadSelectedOfferingDetailsByLocationAndProgram,
    loadSelectedLocationProgramRestrictions,
  };
}
