import { InstitutionService } from "../services/InstitutionService";
import { EducationProgramService } from "../services/EducationProgramService";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { OptionItemDto } from "../types";
import { useFormioUtils } from ".";

/**
 * Common methods to load dropdowns(selects) data on Form.IO that could
 * be reusable or at least simplify the form data load logic.
 * @returns Methods to help loading the data into Form.IO forms.
 */
export function useFormioDropdownLoader() {
  const formioUtils = useFormioUtils();
  const loadDropdown = async (
    form: any,
    dropdownName: string,
    loadMethod: Promise<OptionItemDto[]>,
  ) => {
    // Find the dropdown to be populated with the locations.
    const dropdown = formioUtils.getComponent(form, dropdownName);
    const optionsItems = await loadMethod;
    dropdown.component.data.values = optionsItems.map(item => ({
      value: item.id,
      label: item.description,
    }));
  };

  // Retrieve the list of locations from the API and
  // populate a dropdown in a Form.IO component.
  const loadLocations = async (form: any, dropdownName: string) => {
    return loadDropdown(
      form,
      dropdownName,
      InstitutionService.shared.getLocationsOptionsList(),
    );
  };

  // Retrieve the list of programs that have some
  // offering to the locationId.
  const loadProgramsForLocation = async (
    form: any,
    locationId: number,
    dropdownName: string,
  ) => {
    return loadDropdown(
      form,
      dropdownName,
      EducationProgramService.shared.getLocationProgramsOptionList(locationId),
    );
  };

  // Retrieve the list of programs that have some
  // offering to the locationId authorized for
  // a particular ionstitution.
  const loadProgramsForLocationForInstitution = async (
    form: any,
    locationId: number,
    dropdownName: string,
  ) => {
    return loadDropdown(
      form,
      dropdownName,
      EducationProgramService.shared.getLocationProgramsListForInstitutions(
        locationId,
      ),
    );
  };

  // Retrieve the list of offerings for a particular location.
  const loadOfferingsForLocation = async (
    form: any,
    programId: number,
    locationId: number,
    dropdownName: string,
  ) => {
    return loadDropdown(
      form,
      dropdownName,
      EducationProgramOfferingService.shared.getProgramOfferingsForLocation(
        locationId,
        programId,
      ),
    );
  };

  // get offering date of the selected offering and set to the hidden field (selectedOfferingDate) in formio
  const loadSelectedOfferingDate = async (
    form: any,
    offeringId: number,
    fieldId: string,
  ) => {
    const valueToBeLoaded = await EducationProgramOfferingService.shared.getProgramOfferingDetails(
      offeringId,
    );
    return formioUtils.setComponentValue(
      form,
      fieldId,
      valueToBeLoaded?.studyStartDate,
    );
  };

  // Retrieve the list of offerings for a particular location.
  const loadOfferingsForLocationForInstitution = async (
    form: any,
    programId: number,
    locationId: number,
    dropdownName: string,
  ) => {
    return loadDropdown(
      form,
      dropdownName,
      EducationProgramOfferingService.shared.getProgramOfferingsForLocationForInstitution(
        locationId,
        programId,
      ),
    );
  };

  return {
    loadLocations,
    loadProgramsForLocation,
    loadProgramsForLocationForInstitution,
    loadOfferingsForLocation,
    loadSelectedOfferingDate,
    loadOfferingsForLocationForInstitution,
  };
}
