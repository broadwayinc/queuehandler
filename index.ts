class QueueHandler {
    version = "1.0.0"; // version info

    private items: (() => Promise<any>)[] = []; // job queue
    private breakWhenError: boolean = false; // whether to stop on error
    private batchSize: number = 1; // number of jobs to process at once
    private onProgress?: (progress: {
        batchToProcess: number; // remaining batch count
        itemsToProcess: number; // remaining job count
        completed: any[]; // completed job results array
    }) => void; // progress callback

    private completed: any[] = []; // completed job results array
    private runningBatches: (() => Promise<any>)[] = []; // currently running batch count
    private runningSlots: boolean[] = []; // running slot status array

    private get batchToProcess() {
        // calculate total batch count
        return Math.ceil(this.items.length / this.batchSize);
    }

    private get batchProcessFinished() {
        let completedCount = Object.keys(this.completed).length;
        let isFinished = completedCount === this.runningBatches.length;

        if (isFinished) {
            const completed = this.completed; // copy

            // reset state before calling callback
            this.completed = [];
            this.runningBatches = [];
            this.runningSlots = [];

            if (this.onProgress) {
                this.onProgress({
                    batchToProcess: this.batchToProcess,
                    itemsToProcess: this.items.length,
                    completed: completed,
                });
            }
        }

        return isFinished;
    }

    constructor(option?: {
        breakWhenError?: boolean;
        onProgress?: (progress: {
            batchToProcess: number;
            itemsToProcess: number;
            completed: any[];
        }) => void;
        batchSize?: number; // must be at least 1, default is 1
    }) {
        this.breakWhenError = !!option?.breakWhenError;
        this.batchSize = option?.batchSize ?? 1;

        if (typeof this.batchSize !== "number" || this.batchSize < 1) {
            throw new Error("batchSize must be at least 1");
        }

        if (option?.onProgress) {
            if (typeof option.onProgress === "function") {
                this.onProgress = option.onProgress;
            } else {
                throw new Error("onProgress must be a function");
            }
        }
    }

    // add jobs to the queue at once
    add(jobs: (() => Promise<any>)[] | (() => Promise<any>)) {
        // check if jobs is an array, if not convert to array
        const jobsArray = Array.isArray(jobs) ? jobs : [jobs];

        // check if each job is a function, if so add to queue
        for (const job of jobsArray) {
            if (typeof job !== "function") {
                throw new Error(
                    "Each job must be a function that returns a Promise"
                );
            }
            this.items.push(job);
        }

        this.processNext();
    }

    // process next batch of jobs
    private processNext() {
        // exit if queue is empty
        if (this.items.length === 0) {
            return;
        }

        const batchToRun = this.batchSize - this.runningBatches.length;
        if (batchToRun <= 0) {
            // exit if current running batches reached maximum
            return;
        }

        // extract batchToRun amount of jobs
        this.runningBatches.push(...this.items.splice(0, batchToRun));

        for (let i = 0; i < this.runningBatches.length; i++) {
            if (this.runningSlots?.[i]) {
                continue;
            }

            this.runningSlots[i] = true;
            (this.runningBatches[i] as () => Promise<any>)()
                .then((result) => {
                    if (this.completed[i]) {
                        return result;
                    }

                    this.completed[i] = result;

                    if (this.batchProcessFinished) {
                        return this.processNext();
                    }

                    return result;
                })
                .catch((err) => {
                    // error handling
                    if (this.breakWhenError) {
                        throw err;
                    }

                    this.completed[i] = err;

                    if (this.batchProcessFinished) {
                        return this.processNext();
                    }

                    return err;
                });
        }
    }

    terminate() {
        // remove all remaining jobs from queue
        this.items = [];
    }
}

export default QueueHandler;
