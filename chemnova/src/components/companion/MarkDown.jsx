import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const isBlock = (className, children) => /language-/.test(className ?? '') || String(children).includes('\n')

const heading = ({ children }) => <h3 className="mt-5 text-base font-semibold first:mt-0">{children}</h3>

const components = {
  h1: heading,
  h2: heading,
  h3: ({ children }) => <h4 className="mt-4 text-sm font-semibold first:mt-0">{children}</h4>,
  h4: ({ children }) => <h4 className="mt-4 text-sm font-semibold first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="mt-3 first:mt-0">{children}</p>,
  ul: ({ children }) => <ul className="mt-3 list-disc space-y-1.5 pl-5 first:mt-0">{children}</ul>,
  ol: ({ children }) => <ol className="mt-3 list-decimal space-y-1.5 pl-5 first:mt-0">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-content">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer noopener" className="text-accent underline underline-offset-2">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-3 border-l-2 border-accent/50 pl-4 text-muted first:mt-0">{children}</blockquote>
  ),
  hr: () => <hr className="my-4 border-border" />,
  table: ({ children }) => (
    <div className="mt-3 overflow-x-auto first:mt-0">
      <table className="w-full border-collapse text-left text-xs sm:text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-border bg-surface-2/60 px-3 py-2 font-semibold whitespace-nowrap">{children}</th>
  ),
  td: ({ children }) => <td className="border-b border-border/60 px-3 py-2">{children}</td>,
  pre: ({ children }) => (
    <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface-2/70 p-4 font-mono text-xs leading-relaxed first:mt-0">
      {children}
    </pre>
  ),
  code: ({ className, children }) =>
    isBlock(className, children) ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>
    ),
}

// Raw HTML in an answer is never rendered, only Markdown
export default function Markdown({ children }) {
  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}