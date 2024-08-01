import Markdown from 'react-markdown'
import rehypeRaw from "rehype-raw";

export const MarkdownPrompt = ({ content, className }: { content: string, className?: string }): JSX.Element => {
  return (
    <Markdown className={className}
      rehypePlugins={[rehypeRaw]}
    >{content}</Markdown>
  )
}