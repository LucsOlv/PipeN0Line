"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_OUTPUT_PORTS = exports.DEFAULT_INPUT_PORTS = exports.TASK_FIELDS = exports.stepConfigSchema = exports.bindingSchema = exports.ioPortSchema = exports.PORT_TYPES = void 0;
exports.areTypesCompatible = areTypesCompatible;
const zod_1 = require("zod");
exports.PORT_TYPES = ['text', 'json', 'code', 'files', 'number', 'boolean'];
exports.ioPortSchema = zod_1.z.object({
    key: zod_1.z.string().min(1).regex(/^[a-z][a-z0-9_]*$/, 'Key must be lowercase snake_case'),
    label: zod_1.z.string().min(1),
    type: zod_1.z.enum(exports.PORT_TYPES),
    required: zod_1.z.boolean().default(true),
});
exports.bindingSchema = zod_1.z.object({
    source: zod_1.z.enum(['task', 'step']),
    field: zod_1.z.string().min(1),
    stepPosition: zod_1.z.number().optional(),
});
exports.stepConfigSchema = zod_1.z.object({
    bindings: zod_1.z.record(zod_1.z.string(), exports.bindingSchema).default({}),
});
/** Built-in task fields available as data sources */
exports.TASK_FIELDS = [
    { key: 'files', label: 'Arquivos do Projeto', type: 'files', required: true },
    { key: 'project_name', label: 'Nome do Projeto', type: 'text', required: true },
    { key: 'branch', label: 'Branch', type: 'text', required: true },
    { key: 'project_path', label: 'Caminho do Projeto', type: 'text', required: true },
];
/** Type compatibility matrix */
const TYPE_COMPAT = {
    text: ['text', 'code', 'json'],
    json: ['json', 'text'],
    code: ['code', 'text'],
    files: ['files', 'text'],
    number: ['number', 'text'],
    boolean: ['boolean', 'text'],
};
function areTypesCompatible(outputType, inputType) {
    return TYPE_COMPAT[outputType]?.includes(inputType) ?? false;
}
/** Default ports for new nodes */
exports.DEFAULT_INPUT_PORTS = [
    { key: 'input', label: 'Input', type: 'text', required: true },
];
exports.DEFAULT_OUTPUT_PORTS = [
    { key: 'output', label: 'Output', type: 'text', required: true },
];
