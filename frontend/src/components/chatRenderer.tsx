import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type ChatRendererProps = {
  content: string
}

export function ChatRenderer({ content }: ChatRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-semibold mb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold mb-1">{children}</h3>,
        p: ({ children }) => <p className="text-sm leading-6 mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside text-sm space-y-1 mb-2 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside text-sm space-y-1 mb-2 last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="leading-5">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        code: (({ inline, children }: { inline?: boolean; children?: React.ReactNode }) => {
          const isInline = inline ?? false
          return isInline ? (
            <code className="rounded bg-muted px-1 py-0.5 text-[12px]">{children}</code>
          ) : (
            <code className="block rounded bg-muted p-2 text-[12px] whitespace-pre-wrap">{children}</code>
          )
        }) as unknown as React.ComponentType,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
