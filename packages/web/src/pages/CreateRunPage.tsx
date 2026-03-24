import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { trpc } from '../trpc'

const branches = ['main', 'develop', 'staging']

export function CreateRunPage() {
  const navigate = useNavigate()
  const [project, setProject] = useState('')
  const [branch, setBranch] = useState('')
  const [debugMode, setDebugMode] = useState(true)

  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: connect to trpc.ai or pipeline mutation
    navigate('/')
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-8 group"
      >
        <Icon name="arrow_back" className="text-sm group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Voltar para Pipelines</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Form Section */}
        <div className="lg:col-span-7">
          <header className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
              Criar Nova Execução
            </h1>
            <p className="text-on-surface-variant max-w-md">
              Configure os parâmetros de acionamento para a pipeline de produção.
            </p>
          </header>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Project */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-on-surface-variant font-label">
                Projeto
              </label>
              <div className="relative group">
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  disabled={projectsLoading}
                  className="w-full bg-surface-container-low text-on-surface px-4 py-4 rounded-xl border-none focus:ring-1 focus:ring-primary/40 focus:bg-surface-container-highest appearance-none transition-all cursor-pointer disabled:opacity-50"
                >
                  {projectsLoading ? (
                    <option value="" disabled>Carregando projetos...</option>
                  ) : !projects || projects.length === 0 ? (
                    <option value="" disabled>
                      Configure a pasta de projetos em Configurações
                    </option>
                  ) : (
                    <>
                      <option value="" disabled>Selecione um projeto...</option>
                      {projects.map((p) => (
                        <option key={p.path} value={p.path}>{p.name}</option>
                      ))}
                    </>
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                  <Icon name="expand_more" />
                </div>
              </div>
              {!projectsLoading && (!projects || projects.length === 0) && (
                <p className="text-xs text-on-surface-variant flex items-center gap-1">
                  <Icon name="info" size={14} />
                  <span>
                    Nenhum projeto encontrado.{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/settings')}
                      className="text-primary underline hover:no-underline"
                    >
                      Configure a pasta de projetos
                    </button>
                  </span>
                </p>
              )}
            </div>

            {/* Branch */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-on-surface-variant font-label">
                Branch
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60">
                  <Icon name="account_tree" className="text-lg" />
                </span>
                <input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface pl-12 pr-4 py-4 rounded-xl border-none focus:ring-1 focus:ring-primary/40 focus:bg-surface-container-highest transition-all placeholder:text-on-surface-variant/40"
                  placeholder="main, develop, feature/xxx"
                  type="text"
                />
              </div>
              <div className="flex gap-2 pt-1">
                {branches.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBranch(b)}
                    className="px-2 py-1 bg-surface-container-highest text-[10px] text-on-surface-variant rounded border border-white/5 cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Debug Mode */}
            <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-on-surface">Debug Mode</p>
                  <p className="text-xs text-on-surface-variant">
                    Executar com logs detalhados e pausa em erro.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDebugMode(!debugMode)}
                  className={`w-10 h-5 rounded-full relative transition-colors border border-white/10 ${debugMode ? 'bg-primary/20' : 'bg-surface-container-highest'}`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 bg-primary rounded-full transition-all ${debugMode ? 'right-1' : 'left-1'}`}
                  />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-b from-primary to-primary-dim text-on-primary font-bold py-4 px-8 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Icon name="play_arrow" fill className="text-xl" />
                Confirmar / Iniciar
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-8 py-4 text-on-surface-variant font-medium hover:bg-surface-container-high rounded-xl transition-all border border-transparent hover:border-outline-variant/15"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>

        {/* Bento Grid Side Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container-highest rounded-xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
            <Icon name="bolt" className="text-primary text-4xl mb-6" />
            <h3 className="text-xl font-bold mb-3">Execução Imediata</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Ao confirmar, os agentes do terminal Kinetic serão provisionados em clusters isolados.
              O tempo médio de inicialização para este projeto é de{' '}
              <span className="text-primary">~14 segundos</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-surface-container rounded-xl p-6 border border-white/5">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-4">
                Última Build
              </p>
              <p className="text-2xl font-bold font-headline">#8291</p>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-tertiary">
                <Icon name="check_circle" className="text-xs" /> SUCESSO
              </div>
            </div>
            <div className="bg-surface-container rounded-xl p-6 border border-white/5">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-4">
                Custo Est.
              </p>
              <p className="text-2xl font-bold font-headline">$0.42</p>
              <div className="mt-2 text-[10px] text-on-surface-variant">p/ execução</div>
            </div>
          </div>

          <div className="flex-1 bg-surface-container-low rounded-xl p-8 border border-white/5 relative overflow-hidden flex flex-col">
            <p className="text-xs font-bold text-on-surface-variant mb-6 flex items-center gap-2">
              <Icon name="history" className="text-sm" /> HISTÓRICO RECENTE
            </p>
            <div className="space-y-6">
              {[
                { branch: 'feature/auth-provider', time: 'há 2 horas por Admin', active: true },
                { branch: 'hotfix/typo-landing', time: 'há 5 horas por CI/CD', active: false },
              ].map((item) => (
                <div key={item.branch} className={`flex items-start gap-4 ${item.active ? '' : 'opacity-50'}`}>
                  <div className={`w-1 h-8 rounded-full mt-1 ${item.active ? 'bg-primary' : 'bg-outline-variant'}`} />
                  <div>
                    <p className="text-sm font-medium">{item.branch}</p>
                    <p className="text-[10px] text-on-surface-variant">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8">
              <div className="w-full h-32 rounded-lg bg-surface-container-lowest overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary/5 to-transparent p-4 flex items-end">
                  <div className="flex gap-1 w-full items-end h-16">
                    {[60, 80, 40, 90, 50, 100].map((h, i) => (
                      <div
                        key={i}
                        className="w-full rounded-t-sm"
                        style={{
                          height: `${h}%`,
                          backgroundColor: `rgba(155, 168, 255, ${0.1 + (h / 100) * 0.6})`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
