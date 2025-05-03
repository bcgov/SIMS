import { FormsAPIOutDTO } from "@/services/http/dto";
import HttpBaseClient from "./common/HttpBaseClient";

export class DynamicFormsApi extends HttpBaseClient {
  async getFormDefinition(formName: string): Promise<any> {
    return this.getCall(`dynamic-form/${formName}`);
  }

  async getFormsList(): Promise<FormsAPIOutDTO> {
    return this.getCall(`dynamic-form`);
  }
}
