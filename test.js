import QueueHandler from "./index.js";

// job creator
const createJob =
    (id, duration, shouldFail = false) =>
    () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (shouldFail) {
                    reject(new Error(`Job ${id} failed`));
                } else {
                    resolve(`Job ${id} completed`);
                }
            }, duration);
        });
    };

// test code
console.log("🚀 QueueHandler test started\n");

let did2ndTest = false;

const onProgress = ({ batchToProcess, itemsToProcess, completed }) => {
    console.log(`Remaining batches: ${batchToProcess}`);
    console.log(`Remaining jobs: ${itemsToProcess}`);
    if(itemsToProcess === 5) {
        queue.terminate();
    }
    console.log(
        "완료된 작업:",
        completed.map((r) => (r instanceof Error ? `Error: ${r.message}` : r))
    );

    console.log("---");

    if (itemsToProcess === 0) {
        console.log("🚀 QueueHandler test completed");

        if (!did2ndTest) {
            console.log("\n🚀 QueueHandler array addition 2nd test started\n");

            did2ndTest = true;
            testArray();
        }
    }
};

const queue = new QueueHandler({
    breakWhenError: false,
    batchSize: 3,
    onProgress: onProgress,
});

const testLoop = () => {
    for (let i = 1; i <= 14; i++) {
        queue.add(createJob(i, 800, i % 3 === 0)); // multiples of 3 will fail
    }
};

testLoop();

const testArray = () => {
    let jobs = [];
    for (let i = 1; i <= 14; i++) {
        jobs.push(createJob(i, 800, i % 3 === 0)); // multiples of 3 will fail
    }
    queue.add(jobs);
};
