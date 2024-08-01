import { CommandSystem, CommandSystemDonate, CommandSystemExit, isCommandSystemDonate, isCommandSystemExit } from './framework/types/commands'
import { Bridge } from './framework/types/modules'

export default class AWSBridge implements Bridge {
  send (command: CommandSystem): void {
    if (isCommandSystemDonate(command)) {
      this.handleDonation(command)
    } else if (isCommandSystemExit(command)) {
      this.handleExit(command)
    } else {
      console.log('[AWSBridge] received unknown command: ' + JSON.stringify(command))
    }
  }

  handleDonation (command: CommandSystemDonate): void {
    // Insert donation handling logic here
    console.log(`[AWSBridge] received donation: ${command.key}=${command.json_string}`)
  }

  handleExit (command: CommandSystemExit): void {
    console.log(`[AWSBridge] received exit: ${command.code}=${command.info}`)
  }
}
