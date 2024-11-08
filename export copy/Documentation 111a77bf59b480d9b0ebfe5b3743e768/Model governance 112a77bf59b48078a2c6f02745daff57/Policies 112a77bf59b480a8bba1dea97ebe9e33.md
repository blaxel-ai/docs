# Policies

Policies are used to program how and where your workloads are deployed on Beamlit. Policies can be defined as code, allowing for easy programming and customization of your Global Inference Network.

Policies apply to the entities they are attached to. They can be attached to individual model deployments, or to a whole environment to enforce them across your workspace.

## Policies overview

Policies essentially describe rules as to how deployments and executions are made ****on Beamlit. 

A policy states all the **allowed options for a specific aspect** (called the *policy type*) ****of deployment or execution (for example: the execution region). 

Example:

- Policy <Country: USA> means that attached workloads will only be able to run in regions that are located in the United States..

When no policies are enforced on a type, all options for this type are considered allowed. Workloads are executed anywhere using Global Inference Network’s default optimizations.

### Policy types

Policies have a **type**, allowing multiple policies to drive various deployment strategies without colliding. Typically, you can easily enforce a policy on the execution location and a policy on the underlying hardware at the same time.

There are currently two types of policies: **location-based** and **GPU-based**.

### Location policies

Location policies give control over which clusters will execute your workloads.

They come in three different formats: 

- policies on **regions** allow to pass a specific list of regions (physical execution clusters) on which the workload can be deployed and executed
    - for example, execute only in the following clusters: *San Francisco, USA* and *Tokyo, Japan*
- policies on **countries** allow to define all physical regions inside of one or several countries at once
    - for example, execute only in the following countries: *USA* and *Ireland*
- policies on **continents** allow to define all physical regions inside of one or several continents at once
    - for example, execute only in *North America*

Refer to our reference on policy GPUs below for more information.

### GPU policies

GPU policies give control over which underlying accelerator (GPU) your workloads will be executed on. 

For example:

- Execute only on NVIDIA A100
- Execute only on NVIDIA L4 or NVIDIA T4

Refer to our reference on policy GPUs below for more information.

## Create a policy

Create a policy using the following CLI command:

< TO COMPLETE >

Policies can also be created using the Beamlit console, the Beamlit APIs and through the Beamlit operator.

## Attach a policy

Attaching a policy to a workload enforces it on the workload. Policies can be attached either to **environments**, or to specific **model deployments** (provided they do not collide with the environment-level policies).

When no policy on a certain type is applied to an environment or a model deployment, **all options for this type are considered allowed**. Workloads are executed anywhere using Global Inference Network’s default optimizations.

### Attaching multiple policies

You can attach multiple policies to the same environment or model deployment, or even apply policies on a model deployment while it already has policies from the linked environment. 

In this situation, their combined effect is the **UNION** of all of their effects for the same type of policy (a.k.a *OR* clause), and **INTERSECTION** across all types of policies (a.k.a *AND* clause).

WHAT IF COMBINING ENVIRONMENT AND DEPLOYMENT

For example:

- Let’s assume the following policies:
    - Policy A: Country is USA
    - Policy B: Region is in: San Francisco, USA or Tokyo, Japan
    - Policy C: GPU is NVIDIA T4
- if the environment has the following combined policies:
    - A and B: then workloads will only execute in Tokyo, Japan, and in any region in the USA (including San Francisco) — on any kind of GPU available there.
    - B and C: then workloads will only execute in Tokyo, Japan or SF, USA, only on T4 GPUs.
    - A and C: then workloads will only execute in any region in the USA, only on T4 GPUs.
    - A and B and C: then workloads will only execute in Tokyo, Japan, and in any region in the USA (including San Francisco) — only on T4 GPUs.
- if we combine environment-level policies and deployment-level policies:
    - to be completed??

max amount of policies?

### Attaching a policy to an environment

Attaching a policy to an environment **enforces it on all models** that are deployed on this environment.

Attach a policy to an environment using the following CLI command:

< TO COMPLETE >

Policies can also be attached using the Beamlit console, the Beamlit APIs and through the Beamlit operator.

### Attaching a policy to a model

Attach a policy to a model deployment using the following CLI command:

< TO COMPLETE >

Policies can also be attached using the Beamlit console, the Beamlit APIs and through the Beamlit operator.

## Policy reference

Below is the list of official names to build policies.

### GPUs

| **Name in policy** | **GPU** |
| --- | --- |
|  |  |
|  |  |

### Locations

| **Name in policy** | **Region** | **Country** | **Continent** |
| --- | --- | --- | --- |
|  |  |  |  |
|  |  |  |  |

| **Name in policy** | **Country** | **Continent** |
| --- | --- | --- |
|  |  |  |
|  |  |  |

| **Name in policy** | **Continent** |
| --- | --- |
|  |  |
|  |  |