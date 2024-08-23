import Markdown from 'react-markdown'
import rehypeRaw from "rehype-raw";
import rehypeExternalLinks from 'rehype-external-links';

export const MarkdownPrompt = ({ content, className }: { content: string, className?: string }): JSX.Element => {
  return (
    <Markdown className={className}
      rehypePlugins={[rehypeRaw, [rehypeExternalLinks, { target: "_blank" }]]}
    >{content}</Markdown>
  )
}