import { Utils } from "formiojs";
import { InstitutionService } from "../services/InstitutionService";
import { EducationProgramService } from "../services/EducationProgramService";

/**
 * Common methods to load data on Form.IO that could be reusable
 * or at least simplify the form data load logic.
 * @returns Methods to help loading the data into Form.IO forms.
 */
export function useFormioDataLoader() {
  // Retrieve the list of locations from the API and
  // populate a dropdown in a Form.IO component.
  const loadLocationsDropdown = async (form: any, dropdownName: string) => {
    // Find the dropdown to be populated with the locations.
    const selectedLocation = Utils.getComponent(
      form.components,
      dropdownName,
      true,
    );

    // Get all locations.
    const locations = await InstitutionService.shared.getLocationsOptionsList();
    // Convert the locations list to be displayed in the dropdown.
    selectedLocation.component.data.values = locations.map(location => ({
      value: location.id,
      label: location.description,
    }));
  };

  // Retrieve the list of programs that have some
  // offering to the locationId.
  const loadProgramsForLocationDropdown = async (
    form: any,
    locationId: number,
    dropdownName: string,
  ) => {
    // Find the dropdown to be populated with the programs.
    const selectedProgram = Utils.getComponent(
      form.components,
      dropdownName,
      true,
    );

    // Get programs that have offerings for the particular location id.
    const programs = await EducationProgramService.shared.getLocationProgramsOptionList(
      locationId,
    );

    console.log(programs);

    // Convert the programs list to be displayed in the dropdown.
    selectedProgram.component.data.values = programs.map(program => ({
      value: program.id,
      label: program.description,
    }));

    console.log(selectedProgram.component.data.values);
  };

  return { loadLocationsDropdown, loadProgramsForLocationDropdown };
}
