import type { Pipeline } from '../types/pipeline'

export const mockPipelines: Pipeline[] = [
  {
    id: 'fe-2584',
    tag: 'FE-2584',
    name: 'Master Saf Taxmanager',
    status: 'running',
    steps: [
      { id: 's1', name: 'Source Fetch', status: 'done', duration: '00:12s', icon: 'check_circle' },
      { id: 's2', name: 'Tax Calculation', status: 'running', duration: '00:42s', icon: 'progress_activity' },
      { id: 's3', name: 'Validation', status: 'pending', duration: '--:--s', icon: 'hourglass_empty' },
      { id: 's4', name: 'Export API', status: 'pending', duration: '--:--s', icon: 'upload' },
    ],
  },
  {
    id: 'be-9021',
    tag: 'BE-9021',
    name: 'Legacy Sync Engine',
    status: 'stopped',
    steps: [
      { id: 's1', name: 'Auth Header', status: 'done', duration: '00:04s', icon: 'check_circle' },
      { id: 's2', name: 'DB Connection', status: 'error', duration: '05:21s', icon: 'error' },
      { id: 's3', name: 'Table Merge', status: 'pending', duration: '--:--s', icon: 'sync' },
    ],
  },
  {
    id: 'do-1102',
    tag: 'DO-1102',
    name: 'Docker Image Dist',
    status: 'completed',
    steps: [
      { id: 's1', name: 'Build Container', status: 'done', duration: '03:45s', icon: 'check_circle' },
      { id: 's2', name: 'Push Registry', status: 'done', duration: '01:20s', icon: 'check_circle' },
    ],
  },
]
