import { Command, Response, CommandSystem, CommandUI } from './commands'

export interface ProcessingEngine {
  start: () => void
  commandHandler: CommandHandler
  terminate: () => void
}

export interface VisualisationEngine {
  start: (rootElement: HTMLElement, locale: string) => void
  render: (command: CommandUI) => Promise<Response>
  terminate: () => void
}

export interface Bridge {
  send: (command: CommandSystem) => Promise<void>
  worker: Worker | undefined
  connectWorker: (worker: Worker) => void
}

export interface CommandHandler {
  onCommand: (command: Command) => Promise<Response>
}
