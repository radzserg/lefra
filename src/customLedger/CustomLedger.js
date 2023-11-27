import { ProjectStartedOperation, } from "./operations/ProjectStartedOperation";
export class CustomLedger {
    id;
    storage;
    constructor(id, storage) {
        this.id = id;
        this.storage = storage;
    }
    async record(data) {
        const operation = new ProjectStartedOperation(this.id, data);
        const transaction = await operation.createTransaction();
        await this.storage.insertTransaction(transaction);
        return transaction;
    }
}
