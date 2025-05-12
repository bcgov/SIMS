import { FormsAPIOutDTO, FormUpdateAPIInDTO } from "@/services/http/dto";
import HttpBaseClient from "./common/HttpBaseClient";

export class DynamicFormsApi extends HttpBaseClient {
  /**
   * Get a form definition from Form.io.
   * @param formName name of the form to be retrieved.
   * @returns form definition.
   */
  async getFormDefinition(formName: string): Promise<any> {
    return this.getCall(`dynamic-form/${formName}`);
  }

  /**
   * List all form definitions that contains the tag 'common' ordered by title.
   * @returns list of form definitions.
   */
  async getFormsList(): Promise<FormsAPIOutDTO> {
    return this.getCall(this.addClientRoot("dynamic-form"));
  }

  /**
   * Update a form definition in Form.io.
   * @param formName Name of the form to be updated.
   * @param payload Form definition to be updated.
   */
  async updateForm(
    formName: string,
    payload: FormUpdateAPIInDTO,
  ): Promise<void> {
    return this.putCall(this.addClientRoot(`dynamic-form/${formName}`), {
      formDefinition: payload.formDefinition,
    });
  }
}
