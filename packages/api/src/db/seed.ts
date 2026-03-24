import { db } from './index'
import { appConfig, featureFlags } from './schema'

export async function seedDefaults() {
  await db.insert(appConfig).values([
    {
      key: 'projectsRoot',
      value: '',
      description: 'Caminho absoluto da pasta raiz de projetos na máquina local',
    },
  ]).onConflictDoNothing()

  await db.insert(featureFlags).values([
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
  ]).onConflictDoNothing()
}
