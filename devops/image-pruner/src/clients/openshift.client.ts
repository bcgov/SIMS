import type {
  DeploymentResource,
  ImageStreamResource,
  JobResource,
  OpenShiftApiClient,
  OpenShiftResponse,
  OpenShiftRestClientModule,
  OpenshiftClientOptions,
} from "../models/openshift.model";

const openshiftRestClient =
  require("openshift-rest-client") as OpenShiftRestClientModule;

async function requestBody<T>(
  request: Promise<OpenShiftResponse<T>>,
): Promise<T> {
  const response = await request;
  return response.body;
}

/**
 * SIMS OpenShift client wrapper used by image-pruner operations.
 */
export class OpenshiftClient {
  private constructor(
    private readonly client: OpenShiftApiClient,
    private readonly options: OpenshiftClientOptions,
  ) {}

  /**
   * Creates an OpenShift client instance.
   * @param options The client initialization options.
   * @returns The initialized SIMS OpenShift client wrapper.
   */
  static async create(
    options: OpenshiftClientOptions,
  ): Promise<OpenshiftClient> {
    const { openShiftUrl, licensePlate, saToken } = options.config;
    const clusterName = openShiftUrl.replace(/(^\w+:|^)\/\//, "");

    const client = await openshiftRestClient.OpenshiftClient({
      loadSpecFromCluster: false,
      config: {
        apiVersion: "v1",
        kind: "Config",
        clusters: [
          {
            name: clusterName,
            cluster: {
              server: openShiftUrl,
            },
          },
        ],
        users: [
          {
            name: `${licensePlate}-user`,
            user: {
              token: saToken,
            },
          },
        ],
        contexts: [
          {
            name: `${clusterName}/${licensePlate}-context`,
            context: {
              cluster: clusterName,
              user: `${licensePlate}-user`,
            },
          },
        ],
        "current-context": `${clusterName}/${licensePlate}-context`,
        preferences: {},
      },
    });

    return new OpenshiftClient(client, options);
  }

  /**
   * Retrieves a deployment resource from the OpenShift cluster.
   * @param namespace The namespace of the deployment.
   * @param name The name of the deployment.
   * @returns The deployment resource.
   */
  async getDeployment(
    namespace: string,
    name: string,
  ): Promise<DeploymentResource> {
    return requestBody(
      this.client.apis.apps.v1.namespaces(namespace).deployments(name).get(),
    );
  }

  /**
   * Retrieves a job resource from the OpenShift cluster.
   * @param namespace The namespace of the job.
   * @param name The name of the job.
   * @returns The job resource.
   */
  async getJob(namespace: string, name: string): Promise<JobResource> {
    return requestBody(
      this.client.apis.batch.v1.namespaces(namespace).jobs(name).get(),
    );
  }

  /**
   * Retrieves an image stream resource from the OpenShift cluster.
   * @param namespace The namespace of the image stream.
   * @param name The name of the image stream.
   * @returns The image stream resource.
   */
  async getImageStream(
    namespace: string,
    name: string,
  ): Promise<ImageStreamResource> {
    return requestBody(
      this.client.apis.image.v1.namespaces(namespace).imagestreams(name).get(),
    );
  }

  /**
   * Deletes an image stream tag from the OpenShift cluster.
   * @param namespace The namespace of the image stream.
   * @param imageStreamName The image stream name.
   * @param tag The tag to delete.
   * @returns A promise that resolves when deletion completes.
   */
  async deleteImageStreamTag(
    namespace: string,
    imageStreamName: string,
    tag: string,
  ): Promise<void> {
    await this.client.apis.image.v1
      .namespaces(namespace)
      .imagestreamtags(`${imageStreamName}:${tag}`)
      .delete();
  }

  /**
   * Returns the configured OpenShift API URL.
   * @returns The OpenShift API URL.
   */
  get openShiftUrl(): string {
    return this.options.config.openShiftUrl;
  }
}
