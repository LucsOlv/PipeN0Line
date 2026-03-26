"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDefaults = seedDefaults;
const index_1 = require("./index");
const schema_1 = require("./schema");
async function seedDefaults() {
    await index_1.db.insert(schema_1.appConfig).values([
        {
            key: 'projectsRoot',
            value: '',
            description: 'Caminho absoluto da pasta raiz de projetos na máquina local',
        },
    ]).onConflictDoNothing();
    await index_1.db.insert(schema_1.featureFlags).values([
        {
            key: 'enable_debug_mode',
            enabled: false,
            description: 'Ativa logs de debug detalhados nas execuções de pipeline',
        },
        {
            key: 'enable_ai_suggestions',
            enabled: true,
            description: 'Exibe sugestões de otimização geradas pela IA após cada execução',
        },
        {
            key: 'enable_experimental_runner',
            enabled: false,
            description: 'Usa o novo runner experimental de tarefas paralelas',
        },
    ]).onConflictDoNothing();
}
