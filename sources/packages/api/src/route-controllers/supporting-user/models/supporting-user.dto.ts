/**
 * Data required to update a supporting user.
 * The validation of the entire model will (and
 * must) be done by the Form.IO dry run.
 */
export interface UpdateSupportingUserDTO {
  applicationNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  phone: string;
  postalCode: string;
  provinceState: string;
  sin: string;
  studentsDateOfBirth: Date;
  studentsLastName: string;
  supportingData: any;
}
