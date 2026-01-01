import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import { cn } from '@/utils/cn';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'text' }: CodeBlockProps) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    codeToHtml(code, {
      lang: language,
      theme: 'dracula',
    })
      .then(setHtml)
      .catch(() => {
        // Fallback to plain text if language not supported
        codeToHtml(code, { lang: 'text', theme: 'dracula' }).then(setHtml);
      });
  }, [code, language]);

  if (!html) {
    return (
      <pre className={cn('bg-dracula-bg border border-dracula-current rounded-lg p-4 overflow-x-auto')}>
        <code className="font-mono text-sm text-dracula-fg">{code}</code>
      </pre>
    );
  }

  return (
    <div
      className={cn(
        '[&_pre]:!bg-dracula-bg [&_pre]:!rounded-lg [&_pre]:!p-4 [&_pre]:!overflow-x-auto',
        '[&_pre]:!border [&_pre]:!border-dracula-current',
        '[&_code]:!font-mono [&_code]:!text-sm'
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
