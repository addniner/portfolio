import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/utils/cn';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
  streaming?: boolean;
}

export function MarkdownRenderer({ content, streaming = true }: MarkdownRendererProps) {
  const [displayedContent, setDisplayedContent] = useState(streaming ? '' : content);

  useEffect(() => {
    if (!streaming) {
      setDisplayedContent(content);
      return;
    }

    setDisplayedContent('');
    const lines = content.split('\n');
    let currentLine = 0;

    const timer = setInterval(() => {
      if (currentLine < lines.length) {
        setDisplayedContent((prev) => prev + (currentLine > 0 ? '\n' : '') + lines[currentLine]);
        currentLine++;
      } else {
        clearInterval(timer);
      }
    }, 10);

    return () => clearInterval(timer);
  }, [content, streaming]);

  return (
    <div
      className={cn(
        'prose prose-invert max-w-none',
        'prose-headings:text-dracula-fg prose-headings:font-bold',
        'prose-h1:text-2xl prose-h1:border-b prose-h1:border-dracula-current prose-h1:pb-2',
        'prose-h2:text-xl prose-h2:text-dracula-purple',
        'prose-h3:text-lg prose-h3:text-dracula-cyan',
        'prose-p:text-dracula-fg/90',
        'prose-a:text-dracula-pink prose-a:no-underline hover:prose-a:underline',
        'prose-strong:text-dracula-orange',
        'prose-code:text-dracula-green prose-code:bg-dracula-current prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
        'prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-0',
        'prose-ul:text-dracula-fg/90 prose-ol:text-dracula-fg/90',
        'prose-li:marker:text-dracula-purple',
        'prose-blockquote:border-l-dracula-purple prose-blockquote:text-dracula-comment',
        'prose-hr:border-dracula-current'
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
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
        {displayedContent}
      </ReactMarkdown>
    </div>
  );
}
