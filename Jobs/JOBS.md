# Jobs API Documentation

The Jobs API manages long-running job executions with multiple tasks.

## Overview

- **Job**: A named container (e.g., "my-job")
- **Execution**: An instance of running tasks
- **Task**: A unit of work with a duration

## Getting Started

### TypeScript

```typescript
import { blJob } from "@blaxel/core";

const job = blJob("my-job");
const executionId = await job.createExecution({
  tasks: [{ duration: 60 }]
});
const result = await job.waitForExecution(executionId);
```

### Python

```python
from blaxel.core.jobs import bl_job
from blaxel.core.client.models.create_job_execution_request import CreateJobExecutionRequest

job = bl_job("my-job")
request = CreateJobExecutionRequest(tasks=[{"duration": 60}])
execution_id = job.create_execution(request)
result = job.wait_for_execution(execution_id, max_wait=180)
```

## API Methods

### Create Execution

Start a new execution with tasks.

**TypeScript:**
```typescript
const executionId = await job.createExecution({
  tasks: [
    { duration: 30 },
    { duration: 60 },
  ]
});
```

**Python:**
```python
# Sync
request = CreateJobExecutionRequest(tasks=[{"duration": 30}, {"duration": 60}])
execution_id = job.create_execution(request)

# Async
execution_id = await job.acreate_execution(request)
```

### Get Execution

Get full execution details.

**TypeScript:**
```typescript
const execution = await job.getExecution(executionId);
console.log(execution.status, execution.metadata);
```

**Python:**
```python
# Sync
execution = job.get_execution(execution_id)

# Async
execution = await job.aget_execution(execution_id)
```

### Get Status

Get just the status (faster than full details).

**TypeScript:**
```typescript
const status = await job.getExecutionStatus(executionId);
// Returns: "pending" | "running" | "completed" | "failed"
```

**Python:**
```python
# Sync
status = job.get_execution_status(execution_id)

# Async
status = await job.aget_execution_status(execution_id)
```

### List Executions

List all executions for a job.

**TypeScript:**
```typescript
const executions = await job.listExecutions();
console.log(`Found ${executions.length} executions`);
```

**Python:**
```python
# Sync
executions = job.list_executions(limit=50)

# Async
executions = await job.alist_executions(limit=50)
```

### Wait for Completion

Poll until execution completes.

**TypeScript:**
```typescript
const result = await job.waitForExecution(executionId, {
  maxWait: 300000,  // 5 minutes (milliseconds)
  interval: 2000,   // Poll every 2 seconds (milliseconds)
});
```

**Python:**
```python
# Sync
result = job.wait_for_execution(
    execution_id,
    max_wait=300,  # 5 minutes (seconds)
    interval=2     # Poll every 2 seconds (seconds)
)

# Async
result = await job.await_for_execution(execution_id, max_wait=300, interval=2)
```

## Complete Example

### TypeScript

```typescript
import { blJob } from "@blaxel/core";

const job = blJob("data-processing");

// Create execution
const executionId = await job.createExecution({
  tasks: [{ duration: 60 }, { duration: 60 }]
});

// Monitor
let status = await job.getExecutionStatus(executionId);
console.log(`Status: ${status}`);

// Wait
try {
  const result = await job.waitForExecution(executionId, {
    maxWait: 180000,
    interval: 5000,
  });
  console.log(`✓ Completed: ${result.status}`);
} catch (error) {
  console.log(`⚠ Timeout: ${error.message}`);
}
```

### Python

```python
from blaxel.core.jobs import bl_job
from blaxel.core.client.models.create_job_execution_request import CreateJobExecutionRequest

job = bl_job("data-processing")

# Create execution
request = CreateJobExecutionRequest(tasks=[{"duration": 60}, {"duration": 60}])
execution_id = job.create_execution(request)

# Monitor
status = job.get_execution_status(execution_id)
print(f"Status: {status}")

# Wait
try:
    result = job.wait_for_execution(execution_id, max_wait=180, interval=5)
    print(f"✓ Completed: {result.status}")
except Exception as error:
    print(f"⚠ Timeout: {error}")
```

### Python (Async)

```python
import asyncio
from blaxel.core.jobs import bl_job
from blaxel.core.client.models.create_job_execution_request import CreateJobExecutionRequest

async def main():
    job = bl_job("data-processing")

    request = CreateJobExecutionRequest(tasks=[{"duration": 60}, {"duration": 60}])
    execution_id = await job.acreate_execution(request)

    status = await job.aget_execution_status(execution_id)
    print(f"Status: {status}")

    result = await job.await_for_execution(execution_id, max_wait=180, interval=5)
    print(f"✓ Completed: {result.status}")

asyncio.run(main())
```

## Status Flow

```
pending → running → completed
                 ↘ failed
```

## Notes

- **Time units**: TypeScript uses milliseconds, Python uses seconds
- **Python sync/async**: Use `method()` for sync, `amethod()` for async
- **Polling**: Adjust `interval` based on expected task duration
- **Timeouts**: Set `maxWait` / `max_wait` longer than total task duration
