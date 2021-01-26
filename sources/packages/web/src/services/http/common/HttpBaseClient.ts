import HttpClient from './HttpClient';

export default abstract class HttpBaseClient
{
  protected apiClient = HttpClient;
  handleRequestError(e:any){
    console.log(e);
  }
}