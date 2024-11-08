# Query a model

Model deployments on Beamlit have an **inference endpoint** which can be used by external consumers to request an inference execution. Inference requests are then routed on Global Inference Network based on the deployment policies associated with your model deployment. 

## Inference endpoints

Whenever you deploy a model on Beamlit, an **inference endpoint** is generated on Global Inference Network.

The inference endpoint looks like this:

< TO COMPLETE > 

There is one distinct endpoint for each **model deployment,** i.e. for each combination of a model and an environment on which it is deployed. 

For example, if you have one version of model “my-model” deployed on the *production* environment and one version deployed on the *development* environment:

- <TO COMPLETE > will call the production deployment
- <TO COMPLETE > will call the environment deployment

?> If you do not specify the environment in the inference request, it will call the *production* environment by default. If the model is not deployed on the production environment, it will return an error.

### Endpoint authentication

By default, models deployed on Beamlit aren’t public. It is necessary to authenticate all inferences requests, via a bearer token.

The evaluation of authentication/authorization for inference requests is managed by the Global Inference Network based on the access given in your workspace:

- Admins can query all models deployed in the workspace
- Simple members can only query the models that they have been given access to

> Making a model publically available is not yet available. Please contact us if this is something that you need today.

## Make an inference request

### Beamlit API

Call the inference endpoint for the model deployment you are requesting.

< TO COMPLETE >

### Beamlit CLI

Make an inference request to the model deployment by running the following command:

< TO COMPLETE >

### Beamlit console

Inference requests can be made from the Beamlit console on the model deployment’s page.

[screen of modal from user interface]