import { Weak } from '../../../../helpers'
import * as React from 'react'
import { Translatable } from '../../../../types/elements'
import TextBundle from '../../../../text_bundle'
import { Translator } from '../../../../translator'
import { ReactFactoryContext } from '../../factory'
import { PropsUIPromptFileInput } from '../../../../types/prompts'
import { PrimaryButton } from '../elements/button'
import { BodyLarge, BodyMedium, BodySmall } from '../elements/text'
import { MarkdownPrompt } from './markdown_prompt'
import useListUserDonations from '../hooks/useListUserDonations'
import JSZip from 'jszip'
import awsConfig from '../../../../../aws.config'
import { AuthContext } from '../../contexts/AuthContext'
import { Login } from '../elements/authentication'
import { BsExclamationDiamond } from 'react-icons/bs'
import { MoonLoader } from 'react-spinners'
import withDarkModeLoader from '../elements/loader_wrapper'
import mediumZoom from 'medium-zoom'

type Props = Weak<PropsUIPromptFileInput> & ReactFactoryContext
const ThemedMoonLoader = withDarkModeLoader(MoonLoader)

function useGetUserDonationAsZip(username: string | null, timestamp: string | null) {
  const [zip, setZip] = React.useState<JSZip | null>(null)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  if (!username || !timestamp) {
    return { zip: null, isLoading: false }
  }

  // Find the user's donations
  const { data } = useListUserDonations(username, timestamp)

  React.useEffect(() => {
    const downloadFiles = async () => {
      const donation = data[0];
      if (!donation) {
        return null
      }
      const zip = new JSZip()
      const downloadUrl = `${awsConfig["lambda-get-url"]}`;
      const promises = donation.files.map((file) => {
        return fetch(downloadUrl, {
          method: "POST",
          body: JSON.stringify({
            bucket_name: awsConfig["s3-bucket-name"],
            path: `${username}/${donation.timestamp}/${file.filename}`
          })
        })
          .then((response) => response.json())
          .then((data) => {
            const { url } = data;
            // Get the file as a blob
            return fetch(url)
              .then((response) => response.blob())
          })
          .then((blob) => {
            zip.file(file.filename, blob)
          })
      });
      await Promise.all(promises)
      return zip
    };

    console.log('[FileInput] Fetching user donation as zip from data', data)
    setIsLoading(true)
    downloadFiles().then((zip) => {
      setZip(zip)
      setIsLoading(false)
    })
  }, [data])

  return { zip, isLoading }
}

export const FileInput = (props: Props): JSX.Element => {
  const [waiting, setWaiting] = React.useState<boolean>(false)
  const [selectedFile, setSelectedFile] = React.useState<File>()
  const input = React.useRef<HTMLInputElement>(null)

  const { resolve } = props
  const { description, note, placeholder, extensions, selectButton, continueButton } = prepareCopy(props)

  function handleClick(): void {
    input.current?.click()
  }

  const urlParams = new URLSearchParams(window.location.search)
  const auth = React.useContext(AuthContext)

  const username = urlParams.get('username')
  const timestamp = urlParams.get('timestamp')
  const isReviewing = urlParams.has('review')
  const { zip, isLoading } = useGetUserDonationAsZip(username, timestamp)

  React.useEffect(() => {
    async function zipAsFile() {
      if (zip) {
        console.log('[FileInput] Creating zip file from user donation', zip)
        const content = await zip.generateAsync({ type: 'blob' })
        if (!content) return
        const zipFile = new File([content], `${timestamp}.zip`)
        setSelectedFile(zipFile)
        console.log('[FileInput] Created zip file: ', zipFile)
        if (zipFile) resolve?.({ __type__: 'PayloadFile', value: zipFile })
      }
    }
    if (auth.username !== username) return
    setWaiting(true)
    zipAsFile().then(() => setWaiting(false))
  }, [zip, isLoading])

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>): void {
    const files = event.target.files
    if (files != null && files.length > 0) {
      setSelectedFile(files[0])
    } else {
      console.log('[FileInput] Error selecting file: ' + JSON.stringify(files))
    }
  }

  function handleConfirm(): void {
    if (selectedFile !== undefined && !waiting) {
      setWaiting(true)
      console.log('[FileInput] Selected file: ', selectedFile)
      resolve?.({ __type__: 'PayloadFile', value: selectedFile })
    }
  }

  // If reviewing, shows a loading spinner
  if (isReviewing) {
    return (
      <div className='flex flex-col gap-8 justify-center items-center'>
        <ThemedMoonLoader size={40} />
        <span className='text-lg text-grey1'>
          Please wait as we prepare your files for viewing...
        </span>
      </div>
    )
  }

  return (
    <>
      <div id='select-panel' className='max-w-3xl flex flex-col gap-8'>
        <div className='flex-wrap text-bodylarge font-body text-grey1 text-left'>
          <MarkdownPrompt content={description} />
        </div>
        {
          !auth.isAuthenticated
            ? (
              <div className='border-l-4 border-primary bg-primary bg-opacity-5 text-lg p-4 flex font gap-4 flex-col'>
                <div className='flex flex-row gap-2'>
                  <BsExclamationDiamond className='text-primary' size={32} />
                  <div className='zoomable flex flex-col gap-2 items-center'>
                    <div>
                      Before you can continue, please log in with the first 8 characters of your activation code. The code can be found under <strong className="text-primary">My Personal Dashboard</strong> in the Australian Mobile Ad Toolkit mobile app.
                    </div>
                    <img src="images/activation_code.png" alt="Activation code location" className='w-1/2 !m-0' />
                  </div>
                </div>
                <div className='flex w-full justify-center'>
                  <Login />
                </div>
              </div>
            )
            : (
              <>
                <div className='p-2 border-2 border-gray-200 dark:border-gray-700  rounded'>
                  <input ref={input} id='input' type='file' className='hidden' accept={extensions} onChange={handleSelect} />
                  <div className='flex flex-row gap-4 items-center'>
                    <BodyMedium text={selectedFile?.name ?? placeholder} margin='' color={selectedFile === undefined ? 'text-grey2' : 'textgrey1'} />
                    <div className='flex-grow' />
                    <PrimaryButton onClick={handleClick} label={selectButton} color='bg-secondary border-secondary text-grey1' />
                  </div>
                </div>
                <div className={`${selectedFile === undefined ? 'opacity-30' : 'opacity-100'}`}>
                  <BodySmall text={note} margin='' />
                  <div className='mt-8' />
                  <div className='flex flex-row gap-4'>
                    <PrimaryButton label={continueButton} onClick={handleConfirm} enabled={selectedFile !== undefined} spinning={waiting} />
                  </div>
                </div>
              </>
            )
        }
      </div>
    </>
  )
}

interface Copy {
  description: string
  note: string
  placeholder: string
  extensions: string
  selectButton: string
  continueButton: string
}

function prepareCopy({ description, extensions, locale }: Props): Copy {
  return {
    description: Translator.translate(description, locale),
    note: Translator.translate(note(), locale),
    placeholder: Translator.translate(placeholder(), locale),
    extensions: extensions,
    selectButton: Translator.translate(selectButtonLabel(), locale),
    continueButton: Translator.translate(continueButtonLabel(), locale)
  }
}

const continueButtonLabel = (): Translatable => {
  return new TextBundle()
    .add('en', 'Continue')
    .add('nl', 'Verder')
}

const selectButtonLabel = (): Translatable => {
  return new TextBundle()
    .add('en', 'Choose file')
    .add('nl', 'Kies bestand')
}

const note = (): Translatable => {
  return new TextBundle()
    .add('en', 'Note: The process to extract the correct data from the file is done on your own computer. No data is stored or sent yet.')
    .add('nl', 'NB: Het proces om de juiste gegevens uit het bestand te halen gebeurt op uw eigen computer. Er worden nog geen gegevens opgeslagen of verstuurd.')
}

const placeholder = (): Translatable => {
  return new TextBundle()
    .add('en', 'Choose a file')
    .add('nl', 'Kies een bestand')
}
