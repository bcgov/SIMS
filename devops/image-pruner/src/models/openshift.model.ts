type UnknownRecord = Record<string, unknown>;

/**
 * Kubernetes object metadata, common to all Kubernetes resources.
 */
export interface KubernetesObjectMeta {
  name?: string;
  namespace?: string;
  uid?: string;
  resourceVersion?: string;
  generation?: number;
  creationTimestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  managedFields?: unknown[];
}

/**
 * Container specification within a pod template, defining the container's image and related settings.
 */
export interface ContainerSpec {
  name?: string;
  image?: string;
  imagePullPolicy?: string;
}

/**
 * Pod specification, defining the containers that should be run within a pod.
 */
export interface PodSpec {
  containers: ContainerSpec[];
}

/**
 * Pod template specification, defining the metadata and specification for pods created by a deployment or job.
 */
export interface PodTemplateSpec {
  metadata?: KubernetesObjectMeta;
  spec: PodSpec;
}

/**
 * Deployment spec definition, representing the desired state of a Kubernetes Deployment, including the number of replicas and the pod template.
 */
export interface DeploymentSpec {
  replicas?: number;
  selector?: UnknownRecord;
  template: PodTemplateSpec;
  strategy?: UnknownRecord;
  revisionHistoryLimit?: number;
  progressDeadlineSeconds?: number;
}

/**
 * Deployment status, representing the current state of a deployment, including the number of replicas and their readiness.
 */
export interface DeploymentStatus {
  observedGeneration?: number;
  replicas?: number;
  updatedReplicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
  conditions?: unknown[];
}

/**
 * Deployment resource definition, representing a Kubernetes Deployment object, which manages a set of replica pods.
 */
export interface DeploymentResource {
  kind: string;
  apiVersion: string;
  metadata: KubernetesObjectMeta;
  spec: DeploymentSpec;
  status?: DeploymentStatus;
}

/**
 * Job spec definition, representing the desired state of a Kubernetes Job, including the pod template and job execution settings.
 */
export interface JobSpec {
  parallelism?: number;
  completions?: number;
  activeDeadlineSeconds?: number;
  backoffLimit?: number;
  selector?: UnknownRecord;
  manualSelector?: boolean;
  template: PodTemplateSpec;
  completionMode?: string;
  suspend?: boolean;
  podReplacementPolicy?: string;
}

/**
 * Job status, representing the current state of a job, including the number of active, succeeded, and failed pods, as well as job conditions and timestamps.
 */
export interface JobStatus {
  conditions?: unknown[];
  startTime?: string;
  completionTime?: string;
  succeeded?: number;
  terminating?: number;
  uncountedTerminatedPods?: UnknownRecord;
  ready?: number;
}

/**
 * Job resource definition, representing a Kubernetes Job object, which manages the execution of one or more pods to completion.
 */
export interface JobResource {
  kind: string;
  apiVersion: string;
  metadata: KubernetesObjectMeta;
  spec: JobSpec;
  status?: JobStatus;
}

/**
 * Image stream tag history item, representing a specific version of an image tag within an OpenShift ImageStream, including its creation timestamp and associated metadata.
 */
export interface ImageStreamTagHistoryItem {
  created: string;
  dockerImageReference?: string;
  image: string;
  generation?: number;
}

/**
 * Image stream tag definition, representing a specific tag within an OpenShift ImageStream, including its name and history of versions.
 */
export interface ImageStreamTag {
  tag: string;
  items?: ImageStreamTagHistoryItem[];
}

/**
 * Image stream spec definition, representing the desired state of an OpenShift ImageStream, including lookup policy settings.
 */
export interface ImageStreamSpec {
  lookupPolicy?: UnknownRecord;
}

/**
 * Image stream status, representing the current state of an OpenShift ImageStream, including the Docker image repository URLs and the list of tags available in the image stream.
 */
export interface ImageStreamStatus {
  dockerImageRepository?: string;
  publicDockerImageRepository?: string;
  tags?: ImageStreamTag[];
}

/**
 * Image stream resource definition, representing an OpenShift ImageStream object, which manages a collection of container images and their tags within a namespace.
 */
export interface ImageStreamResource {
  kind: string;
  apiVersion: string;
  metadata: KubernetesObjectMeta;
  spec?: ImageStreamSpec;
  status?: ImageStreamStatus;
}

/**
 * OpenShift client response wrapper, representing the HTTP response from an OpenShift API request, including the status code and response body.
 */
export interface OpenShiftResponse<T> {
  statusCode: number;
  body: T;
}

/**
 * OpenShift REST client get resource definition, representing a resource that can be retrieved from the OpenShift API.
 */
export interface OpenShiftGetResource<T> {
  get(): Promise<OpenShiftResponse<T>>;
}

/**
 * OpenShift REST client delete resource definition, representing a resource that can be deleted from the OpenShift API.
 */
export interface OpenShiftDeleteResource {
  delete(): Promise<unknown>;
}

/**
 * OpenShift client configuration, representing the structure of the kubeconfig file used to authenticate and connect to an OpenShift cluster, including cluster and user information.
 */
export interface OpenShiftConfig {
  apiVersion: string;
  kind: string;
  clusters: Array<{
    name: string;
    cluster: {
      server: string;
    };
  }>;
  users: Array<{
    name: string;
    user: {
      token: string;
    };
  }>;
  contexts: Array<{
    name: string;
    context: {
      cluster: string;
      user: string;
    };
  }>;
  "current-context": string;
  preferences: Record<string, never>;
}

/**
 * OpenShift client options, representing the configuration options for creating an OpenShift client, including whether to load the specification from the cluster and the client configuration.
 */
export interface OpenShiftClientOptions {
  loadSpecFromCluster: boolean;
  config: OpenShiftConfig;
}

/**
 * OpenShift client interface, representing the methods available for interacting with the OpenShift API, including retrieving deployments, jobs, image streams, and deleting image stream tags.
 */
export interface OpenShiftClient {
  apis: {
    apps: {
      v1: {
        namespaces(namespace: string): {
          deployments(name: string): OpenShiftGetResource<DeploymentResource>;
        };
      };
    };
    batch: {
      v1: {
        namespaces(namespace: string): {
          jobs(name: string): OpenShiftGetResource<JobResource>;
        };
      };
    };
    image: {
      v1: {
        namespaces(namespace: string): {
          imagestreams(name: string): OpenShiftGetResource<ImageStreamResource>;
          imagestreamtags(name: string): OpenShiftDeleteResource;
        };
      };
    };
  };
}

/**
 * OpenShift REST client module definition, representing the structure of the module used to create an OpenShift client instance, including the method for creating the client with the specified options.
 */
export interface OpenShiftRestClientModule {
  OpenshiftClient(options: OpenShiftClientOptions): Promise<OpenShiftClient>;
}
