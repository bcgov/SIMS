import {
  AppsV1Api,
  BatchV1Api,
  CustomObjectsApi,
  KubeConfig,
  V1Deployment,
  V1Job,
} from "@kubernetes/client-node";
import type {
  ImageStreamResource,
  OpenshiftClientOptions,
} from "../models/openshift.model.ts";

/**
 * SIMS OpenShift client wrapper used by image-pruner operations.
 */
export class OpenshiftClient {
  private constructor(
    private readonly appsApi: AppsV1Api,
    private readonly batchApi: BatchV1Api,
    private readonly customApi: CustomObjectsApi,
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
    const { openShiftUrl, saToken } = options.config;

    const kc = new KubeConfig();
    kc.loadFromOptions({
      clusters: [
        {
          name: "cluster",
          cluster: {
            server: openShiftUrl,
            skipTLSVerify: true,
          },
        },
      ],
      users: [
        {
          name: "user",
          user: {
            token: saToken,
          },
        },
      ],
      contexts: [
        {
          name: "context",
          context: {
            cluster: "cluster",
            user: "user",
          },
        },
      ],
      currentContext: "context",
    });

    const appsApi = kc.makeApiClient(AppsV1Api);
    const batchApi = kc.makeApiClient(BatchV1Api);
    const customApi = kc.makeApiClient(CustomObjectsApi);

    return new OpenshiftClient(appsApi, batchApi, customApi, options);
  }

  /**
   * Retrieves a deployment resource from the OpenShift cluster.
   * @param namespace The namespace of the deployment.
   * @param name The name of the deployment.
   * @returns The deployment resource.
   */
  async getDeployment(namespace: string, name: string): Promise<V1Deployment> {
    return await this.appsApi.readNamespacedDeployment({
      name,
      namespace,
    });
  }

  /**
   * Retrieves a job resource from the OpenShift cluster.
   * @param namespace The namespace of the job.
   * @param name The name of the job.
   * @returns The job resource.
   */
  async getJob(namespace: string, name: string): Promise<V1Job> {
    return await this.batchApi.readNamespacedJob({
      name,
      namespace,
    });
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
    return await this.customApi.getNamespacedCustomObject({
      group: "image.openshift.io",
      version: "v1",
      namespace,
      plural: "imagestreams",
      name,
    });
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
    await this.customApi.deleteNamespacedCustomObject({
      group: "image.openshift.io",
      version: "v1",
      namespace,
      plural: "imagestreamtags",
      name: `${imageStreamName}:${tag}`,
    });
  }
}
