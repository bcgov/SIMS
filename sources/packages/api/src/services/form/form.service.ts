import { Injectable } from "@nestjs/common";
import { WorkflowConfig } from "src/types";
import { ConfigService } from "../config/config.service";
import axios from "axios";

@Injectable()
export class FormService {
  constructor(private readonly configService: ConfigService) {}

  get config(): WorkflowConfig {
    return this.configService.getConfig().workflow;
  }

  async fetch(formName: string) {
    const content = await axios.get(`${this.config.formsUrl}/${formName}`);
    return content.data;
  }

  async list() {
    return (
      await axios.get(`${this.config.formsUrl}/form?type=form&tags=common`)
    ).data;
  }
}
