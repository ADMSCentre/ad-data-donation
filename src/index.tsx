import './fonts.css'
import './framework/styles.css'
import Assembly from './framework/assembly'
import { Bridge } from './framework/types/modules'
import LiveBridge from './live_bridge'
import FakeBridge from './fake_bridge'
import AWSBridge from './aws_bridge'

const rootElement = document.getElementById('root') as HTMLElement

const workerFile = new URL('./framework/processing/py_worker.js', import.meta.url)
const worker = new Worker(workerFile)

let assembly: Assembly

const run = (bridge: Bridge, locale: string): void => {
  bridge.connectWorker(worker)
  assembly = new Assembly(worker, bridge)
  assembly.visualisationEngine.start(rootElement, locale)
  assembly.processingEngine.start()
}

console.log(`Running AWSBridge in ${process.env.NODE_ENV} mode`)

run(new AWSBridge(), 'en')

const observer = new ResizeObserver(() => {
  const height = window.document.body.scrollHeight
  const action = 'resize'
  window.parent.postMessage({ action, height }, '*')
})

observer.observe(window.document.body)
