import { InstitutionService } from "../services/InstitutionService";
import { EducationProgramService } from "../services/EducationProgramService";
import { ProgramInfoRequestService } from "@/services/ProgramInfoRequestService";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { ProgramYearService } from "@/services/ProgramYearService";
import { FormIOComponent, FormIOForm, OfferingIntensity } from "../types";
import { useFormioUtils } from ".";
import { OptionItemAPIOutDTO } from "@/services/http/dto";
/**
 * Common methods to load dropdowns(selects) data on Form.IO that could
 * be reusable or at least simplify the form data load logic.
 * @returns Methods to help loading the data into Form.IO forms.
 */
export function useFormioDropdownLoader() {
  const formioUtils = useFormioUtils();
  const { getComponent } = useFormioUtils();
  const loadDropdown = async (
    form: FormIOForm,
    targetDropdown: string | FormIOComponent,
    loadMethod: Promise<OptionItemAPIOutDTO[]> | OptionItemAPIOutDTO[],
  ): Promise<void> => {
    // Find the dropdown to be populated.
    let dropdown: FormIOComponent;
    if (typeof targetDropdown === "string") {
      dropdown = getComponent(form, targetDropdown);
    } else {
      dropdown = targetDropdown;
    }
    const optionsItems = await loadMethod;
    dropdown.component.data.values = optionsItems.map(
      (item: OptionItemAPIOutDTO) => ({
        value: item.id,
        label: item.description,
      }),
    );
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

  /**
   * Populate program intensity dropdown.
   * @param form form.
   * @param isFulltimeAllowed is fulltime allowed.
   * @param dropdownName dropdown name.
   */
  const loadProgramIntensityDetails = async (
    form: any,
    isFulltimeAllowed: boolean,
    dropdownName: string,
  ): Promise<void> => {
    return loadDropdown(
      form,
      dropdownName,
      getProgramIntensityDetails(isFulltimeAllowed),
    );
  };

  /**
   * Gets the program intensity details.
   * @param isFulltimeAllowed is fulltime allowed.
   * @returns the program intensity details.
   */
  const getProgramIntensityDetails = (
    isFulltimeAllowed: boolean,
  ): OptionItemAPIOutDTO[] => {
    if (isFulltimeAllowed) {
      return [
        {
          id: "Full Time",
          description: "Full Time",
        },
        {
          id: "Part Time",
          description: "Part Time",
        },
      ];
    }
    return [
      {
        id: "Part Time",
        description: "Part Time",
      },
    ];
  };

  // Retrieve the list of programs that have some
  // offering to the locationId.
  const loadProgramsForLocation = async (
    form: any,
    locationId: number,
    dropdownName: string,
    programYearId: number,
    isIncludeInActiveProgramYear?: boolean,
  ) => {
    return loadDropdown(
      form,
      dropdownName,
      EducationProgramService.shared.getLocationProgramsOptionList(
        locationId,
        programYearId,
        isIncludeInActiveProgramYear,
      ),
    );
  };

  /**
   * Retrieve the list of programs for a particular institution.
   * @param form form in which the dropdown is loaded.
   * @param dropdownName dropdown name.
   * @param options method options:
   * - `isIncludeInActiveProgram`: if isIncludeInActiveProgram, then both active
   * and not active education program is considered.
   */
  const loadProgramsForInstitution = async (
    form: any,
    dropdownName: string,
    options?: { isIncludeInActiveProgram?: boolean },
  ) => {
    return loadDropdown(
      form,
      dropdownName,
      EducationProgramService.shared.getProgramsListForInstitutions(options),
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
    isIncludeInActiveProgramYear?: boolean,
  ) => {
    return loadDropdown(
      form,
      dropdownName,
      EducationProgramOfferingService.shared.getProgramOfferingsOptionsList(
        locationId,
        programId,
        programYearId,
        selectedIntensity,
        isIncludeInActiveProgramYear,
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
    selectedOfferingIntensity: OfferingIntensity,
    isIncludeInActiveProgramYear?: boolean,
  ) => {
    return loadDropdown(
      form,
      dropdownName,
      EducationProgramOfferingService.shared.getProgramOfferingsOptionsList(
        locationId,
        programId,
        programYearId,
        selectedOfferingIntensity,
        isIncludeInActiveProgramYear,
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
    // Find the dropdown to be populated with the locations.
    const dropdown = formioUtils.getFirstComponent(form, dropdownName);
    return loadDropdown(
      form,
      dropdown,
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

  const loadInstitutionNames = async (form: FormIOForm, apiKey: string) => {
    const institutionNames =
      await InstitutionService.shared.getInstitutionNameOptions();
    const mappedInstitutionNames = institutionNames.map((institution) => ({
      value: institution.id,
      label: institution.description,
    }));
    formioUtils.setComponentValue(form, apiKey, mappedInstitutionNames);
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
    loadProgramIntensityDetails,
    loadDropdown,
    loadInstitutionNames,
  };
}
