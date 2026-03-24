"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveAll = void 0;
exports.getCopilotClient = getCopilotClient;
exports.startCopilotClient = startCopilotClient;
exports.stopCopilotClient = stopCopilotClient;
const copilot_sdk_1 = require("@github/copilot-sdk");
Object.defineProperty(exports, "approveAll", { enumerable: true, get: function () { return copilot_sdk_1.approveAll; } });
let instance = null;
function getCopilotClient() {
    if (!instance) {
        instance = new copilot_sdk_1.CopilotClient({ useLoggedInUser: true });
    }
    return instance;
}
async function startCopilotClient() {
    await getCopilotClient().start();
}
async function stopCopilotClient() {
    if (instance) {
        await instance.stop();
        instance = null;
    }
}
