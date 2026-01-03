import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        // Base prose with theme support
        'prose max-w-none',
        'dark:prose-invert',

        // Headings
        'prose-headings:text-foreground prose-headings:font-bold',
        'prose-h1:text-2xl prose-h1:border-b prose-h1:border-border prose-h1:pb-2',
        'prose-h2:text-xl prose-h2:text-primary',
        'prose-h3:text-lg prose-h3:text-info',

        // Paragraphs and text
        'prose-p:text-foreground/90',
        'prose-strong:text-warning',

        // Links
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline hover:prose-a:text-primary/80',

        // Code
        'prose-code:text-success prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
        'prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-0',

        // Lists
        'prose-ul:text-foreground/90 prose-ol:text-foreground/90',
        'prose-li:marker:text-primary',

        // Blockquote
        'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',

        // Horizontal rule
        'prose-hr:border-border'
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !className;

            if (isInline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                code={String(children).replace(/\n$/, '')}
                language={match?.[1] || 'text'}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
