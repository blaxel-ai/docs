# Model overflow

When you deploy applications on your own clusters, these apps experience diverse and varying traffic throughout the day. Usage surge will sometimes happen unexpectedly and consumers still expect to be served without downtime. If those applications are GPU-accelerated AI workloads, this can result in critical failures due to how time-consuming it is to boot additional worker machines, often requiring manual intervention.

In this situation, IT teams allow AI software (think a model) to overflow on ‘tier 2 clusters’. Beamlit provides extensive offloading capabilities so you can use Beamlit’s Global Inference Network as a standby computing platform in case of emergency.

With Beamlit, you can reference your own private Kubernetes cluster as the origin for a model deployment. This defines a **hybrid deployment** between your cluster and Beamlit, with load-balancing being ruled by activation/scale-down metrics. It is also possible to define a hybrid deployment on another of your own private clusters, so you can effectively federate clusters to others across multiple regions.

In short, there are two supported modes for model overflowing:

- **Offload from your own Kubernetes cluster to Beamlit Global Inference Network**: this gives you access to Beamlit’s smart routing of inferences, highly available edge computing regions and complete observability.
- **Offload between two of your own Kubernetes clusters**: this gives you total control over the execution clusters themselves but requires more upfront work from you (setting up the clusters). This is completely open-source software and can be done at no extra cost using Beamlit open-source operator.

[create detailed Excalidraw schema]

### Activating overflow

Overflow is controlled by an **open-source operator** which must be installed in your own Kubernetes cluster. This operator will be in charge of both remotely creating and managing the model on the destination cluster, and monitoring the health of your app, load-balancing requests between your deployment and the one in the destination when required.

Overflow is triggered when a metric (called the *overflow metric*) **hits a certain threshold**, which you can both specify. Once overflow is triggered, the Beamlit operator will automatically route part of the inbound traffic to the destination cluster, using a configurable strategy. This is completely transparent to your application consumers who will call the app through the same way. 

Overflow state remains until the overflow metric remains out of the threshold zone for a certain buffer duration. 

If there is not a current active state of overflow (meaning the overflow metric has not hit the threshold), then **all** inbound requests will go to your own pods on your cluster.

To summarize, overflow is a two-step process: 

1. First, you configure one of your models or AI applications to overflow on a destination, based on a metric and threshold value. At this stage, all requests are handled by your cluster as normal but the Beamlit operator is in watching (**STANDBY**) state.
2. Then, if overflow is triggered, the Beamlit operator will load balance between your own pods and the destination. It will keep doing so until the overflow condition is no longer met and remains so for long enough.

### Offload from your own Kubernetes cluster to Beamlit Global Inference Network

To set-up one of your own model deployments to overflow on Beamlit, you essentially need to **deploy a model on Beamlit** and specify the origin to be a Deployment from your cluster, using the open-source Beamlit operator.

!> The ‘source of truth’ for these types of models is your cluster. As such, creating and managing them can only be done though the Beamlit operator, not from the GUI or APIs.

**Prerequisites**

- A Kubernetes cluster, on which you have a Deployment that is your model or AI application you want to overflow on Beamlit
- Have Prometheus installed on your cluster for metrics querying
- Have Beamlit operator installed on your cluster

This operation uses a CRD (Custom Resource Definition) which gets installed at the same time as the operator. You will create a CR (Custom Resource) pointing at your origin Deployment and apply it via the operator to deploy a ‘copy’ of the model on Beamlit.

Create the following CR, and edit the values as needed:

[code extract of CR]

The overflow metric is defined using a query in Prometheus format. Read our guide about how to set up this overflow metric.

Read our full reference on ModelDeployment for a complete description of all other parameters.

Apply the CR using kubectl:

[kubectl command]

The model is now deployed on Beamlit and the operator is in watching state for the overflow condition to be met.

To un-deploy the model, simply delete the deployment from Beamlit using the operator (via kubectl)

[kubectl command]

### **Offload between two of your own Kubernetes clusters**

This deployment mode only uses the open-source Beamlit operator.

**Prerequisites**

- A Kubernetes cluster, on which you have a Deployment that is your model or AI application you want to overflow on Beamlit
- Have Beamlit operator installed on this origin cluster
- A destination Kubernetes cluster. We provide documentation for correctly setting up your clusters.

This operation uses a CRD (Custom Resource Definition) which gets installed at the same time as the operator. You will create a CR (Custom Resource) pointing at your origin Deployment and apply it via the operator to make

Create the following CR:

[code extract of CR]

The overflow metric is defined using a query in Prometheus format. Read our guide about how to set up this overflow metric.

Read our full reference on ModelDeployment for a complete description of all other parameters.

Apply the CR using kubectl:

[kubectl command]

The model is now deployed on your other cluster and the operator is in watching state for the overflow condition to be met.

To un-deploy the model, simply delete the second model deployment using the operator (via kubectl)

[kubectl command]

Reference to [Comparison of value proposition per deployment mode](https://www.notion.so/Comparison-of-value-proposition-per-deployment-mode-10aa77bf59b480aeae14e6adb353bfc9?pvs=21)?