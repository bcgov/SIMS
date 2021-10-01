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
  // get offering date of the selected offering and set to the hidden field (selectedOfferingDate) in formio
  const loadSelectedOfferingDate = async (
    form: any,
    offeringId: number,
    fieldId: string,
  ) => {
    const valueToBeLoaded = await EducationProgramOfferingService.shared.getProgramOfferingDetails(
      offeringId,
    );
    formioUtils.setComponentValue(
      form,
      fieldId,
      valueToBeLoaded?.studyStartDate,
    );
  };

  // Get Program description for the selected program and set to the field (programDesc) in formio
  const loadProgramDesc = async (
    form: any,
    programId: number,
    fieldId: string,
  ) => {
    const valueToBeLoaded = await EducationProgramService.shared.getStudentEducationProgram(
      programId,
    );
    formioUtils.setComponentValue(
      form,
      fieldId,
      `<h3><span style="background-color:transparent;color:#2965c5;"><strong>${valueToBeLoaded.name}</strong></span></h3>${valueToBeLoaded.description}
      <table style="width:100%">
      <tr>
      <th>Credential</th><th>Delivery Method</th>
      </tr>
      <tr>
      <td>${valueToBeLoaded.credentialType}</td><td>${valueToBeLoaded.deliveryMethod}</td>
      </tr>
      </table>`,
    );
  };

  return {
    loadProgramDesc,
    loadSelectedOfferingDate,
  };
}
