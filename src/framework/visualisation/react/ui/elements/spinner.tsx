import { Weak } from '../../../../helpers'
import { PropsUISpinner } from '../../../../types/elements'

import React from 'react'
import Lottie from 'lottie-react'
import spinnerLight from '../../../../../assets/lottie/spinner-light.json'
import spinnerDark from '../../../../../assets/lottie/spinner-dark.json'

type Props = Weak<PropsUISpinner>

export const Spinner = ({ spinning = true, color = 'light', size = 2 }: Props): JSX.Element => {
  function animationData(): unknown {
    if (color === 'dark') {
      return spinnerDark
    }
    return spinnerLight
  }

  return (
    <div id='spinner' className='flex flex-row items-center gap-4'>
      <div style={{
        width: `${size}rem`,
        height: `${size}rem`
      }}>
        <Lottie animationData={animationData()} loop={spinning} />
      </div>
    </div>
  )
}
