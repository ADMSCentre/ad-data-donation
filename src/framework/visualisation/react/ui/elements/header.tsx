import { Weak } from '../../../../helpers'
import { Translator } from '../../../../translator'
import { PropsUIHeader } from '../../../../types/elements'
import { ReactFactoryContext } from '../../factory'

interface Copy {
  title: string
}

type Props = Weak<PropsUIHeader> & ReactFactoryContext

function prepareCopy({ title, locale }: Props): Copy {
  return {
    title: Translator.translate(title, locale)
  }
}

export const Header = (props: Props): JSX.Element => {
  const { title } = prepareCopy(props)

  return (
    <h1>
      {title}
    </h1>
  )
}
