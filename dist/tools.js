"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTool = createTool;
function createTool(name, description, schema, execute) {
    return {
        name,
        description,
        schema,
        execute,
    };
}
