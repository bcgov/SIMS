import { InstitutionService } from "../services/InstitutionService";
import { EducationProgramService } from "../services/EducationProgramService";
import { ProgramInfoRequestService } from "@/services/ProgramInfoRequestService";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { ProgramYearService } from "@/services/ProgramYearService";
import { OptionItemDto, OfferingIntensity } from "../types";
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
    dropdown.redraw();
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
    programYearId: number,
  ) => {
    return loadDropdown(
      form,
      dropdownName,
      EducationProgramService.shared.getLocationProgramsOptionList(
        locationId,
        programYearId,
      ),
    );
  };

  // Retrieve the list of programs
  // a particular ionstitution.
  const loadProgramsForInstitution = async (
    form: any,
    dropdownName: string,
  ) => {
    return loadDropdown(
      form,
      dropdownName,
      EducationProgramService.shared.getProgramsListForInstitutions(),
    );
  };

  // Retrieve the list of offerings for a particular location.
  const loadOfferingsForLocation = async (
    form: any,
    programId: number,
    locationId: number,
    dropdownName: string,
    programYearId: number,
    selectedIntensity: OfferingIntensity,
  ) => {
    return loadDropdown(
      form,
      dropdownName,
      EducationProgramOfferingService.shared.getProgramOfferingsForLocation(
        locationId,
        programId,
        programYearId,
        selectedIntensity,
      ),
    );
  };

  // Retrieve the list of offerings for a particular location.
  const loadOfferingsForLocationForInstitution = async (
    form: any,
    programId: number,
    locationId: number,
    dropdownName: string,
    programYearId: number,
  ) => {
    return loadDropdown(
      form,
      dropdownName,
      EducationProgramOfferingService.shared.getProgramOfferingsForLocationForInstitution(
        locationId,
        programId,
        programYearId,
      ),
    );
  };

  const loadInstitutionTypes = async (form: any, dropdownName: string) => {
    return loadDropdown(
      form,
      dropdownName,
      InstitutionService.shared.getInstitutionTypeOptions(),
    );
  };

  const loadProgramYear = async (form: any, dropdownName: string) => {
    return loadDropdown(
      form,
      dropdownName,
      ProgramYearService.shared.getProgramYearOptions(),
    );
  };

  const loadPIRDeniedReasonList = async (form: any, dropdownName: string) => {
    return loadDropdown(
      form,
      dropdownName,
      ProgramInfoRequestService.shared.getPIRDeniedReasonList(),
    );
  };

  return {
    loadLocations,
    loadProgramsForLocation,
    loadProgramsForInstitution,
    loadOfferingsForLocation,
    loadOfferingsForLocationForInstitution,
    loadInstitutionTypes,
    loadPIRDeniedReasonList,
    loadProgramYear,
  };
}
