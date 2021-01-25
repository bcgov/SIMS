import HttpBaseClient from "./common/HttpBaseClient";

export class Config extends HttpBaseClient {
    public async getConfig(): Promise<any> { 
        try{
            const response = await this.apiClient.get("config");
            return response.data;
        }
        catch (error){
            this.handleRequestError(error);
            throw error;
        }
    };
};