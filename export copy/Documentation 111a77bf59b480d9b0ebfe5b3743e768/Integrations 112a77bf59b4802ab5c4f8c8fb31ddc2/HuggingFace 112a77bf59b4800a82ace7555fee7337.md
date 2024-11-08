# HuggingFace

The HuggingFace integration allows Beamlit users to **deploy models that are stored on a HuggingFace repository**, either public, gated or private, directly on Beamlit.

The integration must be set up by an admin in the Integrations section in the workspace settings.

## Set up the integration

In order to use this integration, you must register a HuggingFace access token into the workspace settings. The scope of this access token (i.e. the HuggingFace resources it is allowed to access) will be the scope that Beamlit has access to.

There are two ways you can set up this token: using a HuggingFace account that you used to login to Beamlit (the fast method), or setting up the integration from scratch in the workspace settings (the method recommended to go to production).

### Using your HuggingFace account directly

!> This method is not recommended for production use.

When signing up or logging in to Beamlit, you can use your HuggingFace account as a social login method. 

If you're logged in this way and no HuggingFace integration exists in your workspace, the Beamlit console will offer to save your account credentials in the workspace to connect it to HuggingFace.

> Note that everyone in your workspace will be able to use this integration to deploy model from HuggingFace, impersonating you for every API call made to HuggingFace. 

[image of HuggingFace one-click connect]

The token saved in the workspace has a expiration duration of XX days. After this period, the token will no longer be valid and you will no longer be able to use the integration to deploy from HuggingFace. We recommend that you setup a dedicated HuggingFace access token at this time.

This integration can be revoked at any step by going to the workspace settings.

### Using a dedicated HuggingFace access token

You will first need to generate a HuggingFace access token from your HuggingFace settings. Give this access token the scope that you want Beamlit to access on HuggingFace (e.g. repositories, etc.). 

In the workspace settings, in the *HuggingFace* integration, paste this token into the “Access token” section.

[image of HuggingFace integration page]

WHAT ABOUT ENTERPRISE HUB?

## Deploy from HuggingFace

Once you’ve set up the integration in the workspace, any workspace member can use it to reference a HuggingFace repository as the origin for a model deployment. 

### Public and private models

When deploying a model, select “Deploy from HuggingFace”. You can search for any **public model**, or any **private model in the organizations & repositories allowed by the integration’s token.**

[picture of model deployment]

### Gated models

If the model you're trying to deploy is [gated](https://huggingface.co/docs/hub/models-gated), you'll **first need to request access on HuggingFace,** and accept their terms and conditions of usage (if applicable). Access to some HuggingFace models is granted immediately after request, while others require manual approval.

When the model gets deployed, Beamlit will check if the **integration token is allowed access to the model** on HuggingFace. If you have not been allowed access, the model deployment will fail in error.