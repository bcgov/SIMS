import { Injectable } from "@nestjs/common";
import {
  EducationProgramOfferingService,
  InstitutionLocationService,
  EducationProgramService,
} from "../../services";
import { ApplicationFormData } from "./models/application.model";
import { getOfferingNameAndPeriod } from "../../utilities";
import { ApprovalStatus } from "../../services/education-program/constants";
import { ApplicationData } from "../../database/entities";
/**
 * This service controller is a provider which is created to extract the implementation of
 * controller in one place as their business logic is shared between different client types.
 * (e.g. AEST and Student).
 */
@Injectable()
export class ApplicationControllerService {
  constructor(
    private readonly offeringService: EducationProgramOfferingService,
    private readonly locationService: InstitutionLocationService,
    private readonly programService: EducationProgramService,
  ) {}
  /**
   * Add location, program and offering labels
   * and reset the dropdown value for non
   *  designated location and not approved
   * programs.
   * @param data application data
   * @returns [ApplicationData, ApplicationFormData]
   */
  async addLabelsAndResetDropdownForReadOnly(
    data: ApplicationData,
  ): Promise<[ApplicationData, ApplicationFormData]> {
    const additionalFormData = {} as ApplicationFormData;
    // Check wether the selected location is designated or not.
    // If selected location is not designated, then make the
    // selectedLocation null
    if (data.selectedLocation) {
      const designatedLocation =
        await this.locationService.getDesignatedLocationById(
          data.selectedLocation,
        );
      const selectedLocation = await this.locationService.getLocationById(
        data.selectedLocation,
      );
      if (!designatedLocation) {
        data.selectedLocation = null;
      }
      // Assign location name for readonly form
      additionalFormData.selectedLocationName = selectedLocation?.name;
    }
    // Check wether the program is approved or not.
    // If selected program is not approved, then make the
    // selectedLocation null
    if (data.selectedProgram) {
      const selectedProgram = await this.programService.getProgramById(
        data.selectedProgram,
      );

      if (selectedProgram) {
        // Assign program name for readonly form
        additionalFormData.selectedProgramName = selectedProgram.name;
        if (selectedProgram.approvalStatus !== ApprovalStatus.approved) {
          data.selectedProgram = null;
        }
      } else {
        data.selectedProgram = null;
      }
    }
    // Get selected offering details.
    if (data.selectedOffering) {
      const selectedOffering = await this.offeringService.getOfferingById(
        data.selectedOffering,
      );
      if (selectedOffering) {
        additionalFormData.selectedOfferingName =
          getOfferingNameAndPeriod(selectedOffering);
      } else {
        data.selectedOffering = null;
      }
    }
    return [data, additionalFormData];
  }
}
