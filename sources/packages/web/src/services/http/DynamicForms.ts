import { FormsAPIOutDTO, FormUpdateAPIInDTO } from "@/services/http/dto";
import HttpBaseClient from "./common/HttpBaseClient";

export class DynamicFormsApi extends HttpBaseClient {
  async getFormDefinition(formName: string): Promise<any> {
    return this.getCall(`dynamic-form/${formName}`);
  }

  async getFormsList(): Promise<FormsAPIOutDTO> {
    return this.getCall(`dynamic-form`);
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
    return this.putCall(`dynamic-form/${formName}`, {
      formDefinition: payload.formDefinition,
    });
  }
}
