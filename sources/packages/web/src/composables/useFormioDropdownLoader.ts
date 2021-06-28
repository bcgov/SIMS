import { Utils } from "formiojs";
import { InstitutionService } from "../services/InstitutionService";
import { EducationProgramService } from "../services/EducationProgramService";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { OptionItemDto } from "../types";

/**
 * Common methods to load dropdowns(selects) data on Form.IO that could
 * be reusable or at least simplify the form data load logic.
 * @returns Methods to help loading the data into Form.IO forms.
 */
export function useFormioDropdownLoader() {
  const loadDropdown = async (
    form: any,
    dropdownName: string,
    loadMethod: Promise<OptionItemDto[]>,
  ) => {
    // Find the dropdown to be populated with the locations.
    const locationsDropdown = Utils.getComponent(
      form.components,
      dropdownName,
      true,
    );
    const optionsItems = await loadMethod;
    locationsDropdown.component.data.values = optionsItems.map(item => ({
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

  return {
    loadLocations,
    loadProgramsForLocation,
    loadOfferingsForLocation,
  };
}
