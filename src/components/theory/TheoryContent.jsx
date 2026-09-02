import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

export default function TheoryContent({ content }) {
  return (
    <article className="text-[1rem] leading-8 text-text-main sm:text-[1.05rem]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => <h1 className="mt-10 text-3xl font-bold leading-tight text-text-main first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-10 text-2xl font-bold leading-tight text-text-main">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-8 text-xl font-bold text-text-main">{children}</h3>,
          p: ({ children }) => <p className="mt-5 text-muted first:mt-0">{children}</p>,
          ul: ({ children }) => <ul className="mt-5 list-disc space-y-2 pl-6 text-muted marker:text-accent">{children}</ul>,
          ol: ({ children }) => <ol className="mt-5 list-decimal space-y-2 pl-6 text-muted marker:font-bold marker:text-accent">{children}</ol>,
          blockquote: ({ children }) => <blockquote className="mt-6 rounded-r-xl border-l-4 border-accent bg-accent/10 px-5 py-4 text-text-main">{children}</blockquote>,
          pre: ({ children }) => <pre className="mt-6 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6 text-text-main">{children}</pre>,
          code: ({ className, children }) => <code className={className || 'rounded bg-background px-1.5 py-0.5 font-mono text-[0.9em] text-accent'}>{children}</code>,
          hr: () => <hr className="my-8 border-border" />,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="font-bold text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-text-main">{children}</a>,
          table: ({ children }) => <div className="mt-6 overflow-x-auto rounded-xl border border-border"><table className="min-w-full text-left text-sm">{children}</table></div>,
          th: ({ children }) => <th className="border-b border-border bg-background px-4 py-3 font-bold text-text-main">{children}</th>,
          td: ({ children }) => <td className="border-b border-border px-4 py-3 text-muted last:border-b-0">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
