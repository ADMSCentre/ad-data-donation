import { CommandSystem, CommandSystemDonate, CommandSystemDonateFiles, CommandSystemExit, isCommandSystemDonate, isCommandSystemDonateFiles, isCommandSystemExit } from './framework/types/commands'
import { Bridge } from './framework/types/modules'
import config from './aws.config.js'

declare global {
  var pyodide: any
}

export default class AWSBridge implements Bridge {
  worker: Worker | undefined
  
  connectWorker (worker: Worker): void {
    this.worker = worker
  }

  async send (command: CommandSystem): Promise<void> {
    if (isCommandSystemDonate(command)) {
      this.handleDonation(command)
    } else if (isCommandSystemDonateFiles(command)) {
      await this.handleFilesDonation(command)
    }
    else if (isCommandSystemExit(command)) {
      this.handleExit(command)
    } else {
      console.log('[AWSBridge] received unknown command: ' + JSON.stringify(command))
    }
  }

  handleDonation (command: CommandSystemDonate): void {
    console.log(`[AWSBridge] received donation: ${command.key}=${command.json_string}`)
    console.log(`[AWSBridge] sending donation to AWS: ${config['lambda-put-url']}`)

    const requestBody = {
      bucket_name: config['s3-bucket-name'],
      folder_name: "test",
      file_name: command.key,
    }
  }

  async handleFilesDonation (command: CommandSystemDonateFiles): Promise<void> {
    console.log(`[AWSBridge] received files donation: ${command.key}=${command.fileContents}`)
    console.log(`[AWSBridge] sending files donation to AWS: ${config['lambda-put-url']}`)

    const filenames = Object.keys(command.fileContents)

    // Get timestamp, UTC +10 hours in YYYYMMDD_HHMMSS
    const date = new Date()
    date.setHours(date.getHours() + 10)
    const timestamp = date.toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15)
    const targetFolder = localStorage.getItem('username') || command.key

    const putObjectPromises = filenames.map(name => {
      const requestBody = {
        bucket_name: config['s3-bucket-name'],
        folder_name: targetFolder,
        file_name: `${timestamp}/${name}`,
      }
      return fetch(config['lambda-put-url'], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }).then(response => {
        if (response.status !== 200) {
          throw new Error(`[AWSBridge] an error occurred: ${response.status}`)
        }
        return response.json()
      }).then(data => {
        const { url } = data
        const file = command.fileContents[name]
        return fetch(url, {
          method: 'PUT',
          body: file,
        }).then(response => {
          console.log(`[AWSBridge] uploaded file: ${name}`)
        }).catch(error => {
          console.error(`[AWSBridge] failed to upload file: ${name}`)
        })
      }).catch(error => {
        console.error(`[AWSBridge] an error occurred: ${error}`)
      })
    });

    await Promise.all(putObjectPromises)
  }

  handleExit (command: CommandSystemExit): void {
    console.log(`[AWSBridge] received exit: ${command.code}=${command.info}`)
  }
}
