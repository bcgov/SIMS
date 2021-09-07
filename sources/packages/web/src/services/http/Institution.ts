import HttpBaseClient from "./common/HttpBaseClient";
import {
  InstitutionDto,
  InstitutionDetailDto,
  UpdateInstitutionDto,
  InstitutionUserResDto,
  InstitutionUserAndAuthDetailsForStore,
  OptionItemDto,
} from "../../types";
import { AxiosResponse } from "axios";
import { InstitutionUserTypeAndRoleResponseDto } from "../../types/contracts/institution/InstitutionUserTypeAndRoleResponseDto";

export class InstitutionApi extends HttpBaseClient {
  public async createInstitution(
    createInstitutionDto: InstitutionDto,
  ): Promise<void> {
    try {
      await this.apiClient.post(
        "institution",
        createInstitutionDto,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async updateInstitution(data: UpdateInstitutionDto) {
    try {
      await this.apiClient.patch("institution", data, this.addAuthHeader());
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getDetail(): Promise<InstitutionDetailDto> {
    try {
      const resp: AxiosResponse<InstitutionDetailDto> = await this.getCall(
        "institution",
      );
      return resp.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async sync() {
    try {
      await this.apiClient.patch("institution/sync", {}, this.addAuthHeader());
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getUsers(): Promise<InstitutionUserResDto[]> {
    try {
      const resp = await this.apiClient.get(
        "institution/users",
        this.addAuthHeader(),
      );
      return resp.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async removeUser(id: number): Promise<void> {
    await this.apiClient.delete(`institution/user/${id}`, this.addAuthHeader());
  }

  public async getUserTypeAndRoles(): Promise<
    InstitutionUserTypeAndRoleResponseDto
  > {
    try {
      const resp = await this.apiClient.get(
        "institution/user-types-roles",
        this.addAuthHeader(),
      );
      return resp.data as InstitutionUserTypeAndRoleResponseDto;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getMyInstitutionDetails(
    header?: any,
  ): Promise<InstitutionUserAndAuthDetailsForStore> {
    try {
      const res = await this.apiClient.get(
        `institution/my-details`,
        header || this.addAuthHeader(),
      );
      return res?.data as InstitutionUserAndAuthDetailsForStore;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getInstitutionTypeOptions(): Promise<OptionItemDto[]> {
    try {
      const response = await this.apiClient.get(
        "institution/type/options-list",
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async checkIfExist(guid: string, headers: any): Promise<boolean> {
    try {
      await this.apiClient.head(`institution/${guid}`, headers);
      return true;
    } catch (error) {
      if (404 === error.response.status) {
        return false;
      }
      this.handleRequestError(error);
      throw error;
    }
  }
}
