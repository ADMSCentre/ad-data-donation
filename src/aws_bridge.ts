import { CommandSystem, CommandSystemDonate, CommandSystemDonateFiles, CommandSystemExit, isCommandSystemDonate, isCommandSystemDonateFiles, isCommandSystemExit, isCommandSystemRestart } from './framework/types/commands'
import { Bridge } from './framework/types/modules'
import { DonationFile, postDonation } from './lib/donations-adapter'

declare global {
  var pyodide: any
}

export default class AWSBridge implements Bridge {
  worker: Worker | undefined

  connectWorker(worker: Worker): void {
    this.worker = worker
  }

  async send(command: CommandSystem): Promise<void> {
    if (isCommandSystemDonate(command)) {
      return this.handleDonation(command)
    }
    if (isCommandSystemDonateFiles(command)) {
      return await this.handleFilesDonation(command)
    }
    if (isCommandSystemExit(command)) {
      return this.handleExit(command)
    }
    if (isCommandSystemRestart(command)) {
      console.log(`[AWSBridge] received restart command: ${command.target}`)
      let { target } = command;
      // If the target is __current__, reload the page with all query parameters
      if (target === '__current__') {
        target = window.location.href;
      }
      console.log(`[AWSBridge] restart redirecting to: ${target}`)
      window.location.href = target;
      return;
    }
    console.log('[AWSBridge] received unknown command: ' + JSON.stringify(command))
  }

  handleDonation(command: CommandSystemDonate): void {
    console.log(`[AWSBridge] received donation: ${command.key}=${command.json_string}`)
  }

  async handleFilesDonation(command: CommandSystemDonateFiles): Promise<void> {
    console.log(`[AWSBridge] received files donation: ${command.key}=${command.fileContents}`)
    const username = localStorage.getItem('username') || 'anonymous'
    const platform = command.props.platform || 'unknown'

    // Convert the command.fileContents from Uint8Array to JSON
    const convertFileContent = (fileContent: Uint8Array): object => {
      if (typeof fileContent === 'string') {
        return JSON.parse(fileContent);
      }
      if (fileContent instanceof Uint8Array) {
        return JSON.parse(new TextDecoder().decode(fileContent));
      }
      throw new Error('Unsupported file content type');
    }

    const files: DonationFile[] = Object.keys(command.fileContents).map(filename => ({
      filename,
      content: convertFileContent(command.fileContents[filename] as Uint8Array)
    }))

    await postDonation({
      username,
      platform,
      files
    })
  }

  handleExit(command: CommandSystemExit): void {
    console.log(`[AWSBridge] received exit: ${command.code}=${command.info}`)
  }
}
