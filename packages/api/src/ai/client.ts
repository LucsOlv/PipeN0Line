import { CopilotClient, approveAll } from '@github/copilot-sdk'

let instance: CopilotClient | null = null

export function getCopilotClient(): CopilotClient {
  if (!instance) {
    instance = new CopilotClient({ useLoggedInUser: true })
  }
  return instance
}

export async function startCopilotClient(): Promise<void> {
  await getCopilotClient().start()
}

export async function stopCopilotClient(): Promise<void> {
  if (instance) {
    await instance.stop()
    instance = null
  }
}

export { approveAll }
