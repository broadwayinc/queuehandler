# Qpass

Qpass is a JavaScript/TypeScript queue library for processing tasks sequentially.
It supports batch execution, error handling options, and progress callbacks.

## 📌 Getting started

```js
npm install qpass
```

## 📌 Usage

### Basic usage

```js
import Qpass from "qpass";

const queue = new Qpass();

const job1 = () => Promise.resolve("job1 completed");
const job2 = () => Promise.resolve("job2 completed");

queue.add([job1, job2]);
```

### Option

You can configure options when creating a Qpass instance.

```ts
const queue = new Qpass({
    breakWhenError?: boolean;
    onProgress?: (progress: {
        batchToProcess: number; // Total number of batches remaining
        itemsToProcess: number; // Total remaining tasks
        completed?: any[]; // Array of completed task results
    }) => void;
    batchSize?: number; // must be ≥ 1, default is 1
});
```

### 🔍 OnProgress

The onProgress callback runs when the queue starts and after each batch is completed.

```js
const queue = new Qpass({
    batchSize: 2,
    onProgress: (progress) => {
        console.log(progress);
    },
});

await queue.add([
    () => Promise.resolve("Job 1"),
    () => Promise.resolve("Job 2"),
    () => Promise.resolve("Job 3"),
    () => Promise.resolve("Job 4"),
]);

// Example output:
// { batchToProcess: 1, itemsToProcess: 2, completed: ["Job 1", "Job 2"] }
// { batchToProcess: 0, itemsToProcess: 0, completed: ["Job 3", "Job 4"] }
```

## ❗Handling Errors

Qpass lets you choose whether to stop on error or continue execution when an error occurs.
<br>
This behavior is controlled via the breakWhenError option.

### ✅ Continue execution even on errors (breakWhenError: false)

```js
const queue = new Qpass({
    breakWhenError: false, // default
    onProgress: (progress) => {
        console.log("Completed jobs: ", progress.completed);
    },
});

const jobs = [
    () => Promise.resolve("First success"),
    () => Promise.reject("Second failed ❌"),
    () => Promise.resolve("Third success ✅"),
];

await queue.add(jobs);
```

Result

```js
Completed jobs: ["First success"]
Completed jobs: ["First success", "Second failed ❌", "Third success ✅"]
// Errors are stored as error objects and execution continues.
```

### 🛑 Stop immediately on error (breakWhenError: true)

```js
const queue = new Qpass({
    breakWhenError: true,
    onProgress: (progress) => {
        console.log(`Completed jobs:: `, progress.completed);
    },
});

const jobs = [
    () => Promise.resolve("First success"),
    () => Promise.reject("Second failed ❌"),
    () => Promise.resolve("Third will not run 🚫"),
];

try {
    await queue.add(jobs);
} catch (err) {
    console.error("Execution stopped: ", err);
}
```

Result

```js
Completed jobs: ["First success"]
Execution stopped: Second failed ❌
// Stops immediately on error, so the third job is never executed.
```

## 📌 Practical Example

```js
const queue = new Qpass({
    batchSize: 5,
    onProgress: (progress) => {
        console.log(
            `Remaining batches: ${progress.batchToProcess}, Remaining tasks: ${progress.itemsToProcess}`
        );
    },
});

const jobs = [];

for (let i = 0; i < 100; i++) {
    jobs.push(() => fetch(`/api/data/${i}`).then((res) => res.json()));
}

queue.add(jobs);
```

## 📌 Features

• Batch processing (batchSize) — control how many jobs run in parallel
<br>
• Error control (breakWhenError) — choose whether to stop or continue on failure
<br>
• Progress tracking (onProgress) — monitor task progress in real time
<br>
• Execution state (isRunning) — check whether the queue is currently running