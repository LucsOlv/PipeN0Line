export type PipelineStatus = 'running' | 'stopped' | 'completed' | 'pending'
export type TaskStatus = 'done' | 'running' | 'error' | 'pending'

export interface TaskStep {
  id: string
  name: string
  status: TaskStatus
  duration: string
  icon: string
}

export interface Pipeline {
  id: string
  tag: string
  name: string
  status: PipelineStatus
  steps: TaskStep[]
}
