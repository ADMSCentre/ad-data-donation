import { CommandHandler, ProcessingEngine } from '../types/modules'
import { CommandSystemEvent, isCommand, Response } from '../types/commands'

export default class WorkerProcessingEngine implements ProcessingEngine {
  sessionId: String
  worker: Worker
  commandHandler: CommandHandler

  resolveInitialized!: () => void
  resolveContinue!: () => void

  constructor(sessionId: string, worker: Worker, commandHandler: CommandHandler) {
    this.sessionId = sessionId
    this.commandHandler = commandHandler
    this.worker = worker
    this.worker.onerror = console.log
    this.worker.onmessage = (event) => {
      console.log(
        '[WorkerProcessingEngine] Received event from worker: ',
        event.data.eventType
      )
      this.handleEvent(event)
    }
  }

  sendSystemEvent(name: string): void {
    const command: CommandSystemEvent = { __type__: 'CommandSystemEvent', name }
    this.commandHandler.onCommand(command).then(
      () => { },
      () => { }
    )
  }

  handleEvent(event: any): void {
    const { eventType } = event.data
    console.log('[ReactEngine] received eventType: ', eventType)
    switch (eventType) {
      case 'initialiseDone':
        console.log('[ReactEngine] received: initialiseDone')
        this.resolveInitialized()
        break

      case 'runCycleDone':
        console.log('[ReactEngine] received: event', event.data.scriptEvent)
        this.handleRunCycle(event.data.scriptEvent)
        break

      case 'readFileDone':
        console.log('[ReactEngine] received: readFileDone', event.data)
        break

      default:
        console.log(
          '[ReactEngine] received unsupported flow event: ',
          eventType
        )
    }
  }

  start(): void {
    // If the url is not base url, do not start the engine
    if (window.location.hash !== '') {
      console.log('[WorkerProcessingEngine] not donating, skipped Python worker start')
      return
    }
    // If no platform is specified, do not start the engine
    const platform = new URLSearchParams(window.location.search).get('platform')
    if (platform === null || platform === '') {
      console.log('[WorkerProcessingEngine] no platform, skipped Python worker start')
      return
    }

    console.log('[WorkerProcessingEngine] started')
    const waitForInitialization: Promise<void> = this.waitForInitialization()

    waitForInitialization.then(
      () => {
        this.sendSystemEvent('initialized')
        this.firstRunCycle()
      },
      () => { }
    )
  }

  async waitForInitialization(): Promise<void> {
    return await new Promise<void>((resolve) => {
      this.resolveInitialized = resolve
      const env = {
        ...process.env,
      }
      console.log('[WorkerProcessingEngine] sending initialise with env: ',
        env
      )
      this.worker.postMessage({ eventType: 'initialise', env })
    })
  }

  firstRunCycle(): void {
    // Any configurations that need to be passed to the Python worker.
    // This will be available as the `config` parameter in scripts.py > process
    const config = {
      platform: new URLSearchParams(window.location.search).get('platform') || '',
    }

    this.worker.postMessage({ eventType: 'firstRunCycle', sessionId: this.sessionId, config })
  }

  nextRunCycle(response: Response): void {
    this.worker.postMessage({ eventType: 'nextRunCycle', response })
  }

  terminate(): void {
    this.worker.terminate()
  }

  handleRunCycle(command: any): void {
    if (isCommand(command)) {
      this.commandHandler.onCommand(command).then(
        (response) => this.nextRunCycle(response),
        () => { }
      )
    }
  }
}
