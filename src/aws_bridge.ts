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

  send (command: CommandSystem): void {
    if (isCommandSystemDonate(command)) {
      this.handleDonation(command)
    } else if (isCommandSystemDonateFiles(command)) {
      this.handleFilesDonation(command)
    }
    else if (isCommandSystemExit(command)) {
      this.handleExit(command)
    } else {
      console.log('[AWSBridge] received unknown command: ' + JSON.stringify(command))
    }
  }

  handleDonation (command: CommandSystemDonate): void {
    console.log(`[AWSBridge] received donation: ${command.key}=${command.json_string}`)
    console.log(`[AWSBridge] sending donation to AWS: ${config['lambda-url']}`)

    const requestBody = {
      bucket_name: config['s3-bucket-name'],
      folder_name: "test",
      file_name: command.key,
    }
  }

  handleFilesDonation (command: CommandSystemDonateFiles): void {
    console.log(`[AWSBridge] received files donation: ${command.key}=${command.fileContents}`)
    console.log(`[AWSBridge] sending files donation to AWS: ${config['lambda-url']}`)

    const filenames = Object.keys(command.fileContents)

    // Get timestamp, UTC +10 hours in YYYYMMDD_HHMMSS
    const date = new Date()
    date.setHours(date.getHours() + 10)
    const timestamp = date.toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15)
    const targetFolder = localStorage.getItem('username') || command.key

    for (const name of filenames) {
      console.log(`[AWSBridge] found file: ${name}`)
      // Get pre-signed URL
      const requestBody = {
        bucket_name: config['s3-bucket-name'],
        folder_name: targetFolder,
        file_name: `${timestamp}/${name}`,
      }
      fetch(config['lambda-url'], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }).then(response => {
        console.log(`[AWSBridge] received response: ${response}`)
        // If status is not 200, throw an error
        if (response.status !== 200) {
          throw new Error(`[AWSBridge] an error occurred: ${response.status}`)
        }
        return response.json()
      }).then(data => {
        console.log(`[AWSBridge] received data:`, data)
        const { url } = data
        console.log(`[AWSBridge] received pre-signed URL: ${url}`)
        // Upload file to S3
        const file = command.fileContents[name]
        fetch(url, {
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
    }
  }

  handleExit (command: CommandSystemExit): void {
    console.log(`[AWSBridge] received exit: ${command.code}=${command.info}`)
  }
}
