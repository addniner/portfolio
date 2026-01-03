import { useEffect, useState } from 'react';
import { createHighlighter, type Highlighter } from 'shiki';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';

// Singleton highlighter with limited languages for smaller bundle
let highlighterPromise: Promise<Highlighter> | null = null;

const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'tsx',
  'jsx',
  'json',
  'markdown',
  'bash',
  'sh',
  'css',
  'html',
  'text',
] as const;

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function getHighlighterInstance(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      langs: [...SUPPORTED_LANGUAGES],
      themes: ['github-dark', 'github-light'],
    });
  }
  return highlighterPromise;
}

// Check if language is supported
function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'text' }: CodeBlockProps) {
  const [html, setHtml] = useState<string>('');
  const { resolvedTheme } = useTheme();

  // Map theme to shiki theme
  const shikiTheme = resolvedTheme === 'dark' ? 'github-dark' : 'github-light';

  useEffect(() => {
    const highlight = async () => {
      try {
        const highlighter = await getHighlighterInstance();
        // Use supported language or fallback to text
        const lang = isSupportedLanguage(language) ? language : 'text';
        const result = highlighter.codeToHtml(code, {
          lang,
          theme: shikiTheme,
        });
        setHtml(result);
      } catch {
        // Fallback to plain text display
        setHtml('');
      }
    };
    highlight();
  }, [code, language, shikiTheme]);

  if (!html) {
    return (
      <pre className={cn('bg-muted border border-border rounded-lg p-4 overflow-x-auto')}>
        <code className="font-mono text-sm text-foreground">{code}</code>
      </pre>
    );
  }

  return (
    <div
      className={cn(
        '[&_pre]:!rounded-lg [&_pre]:!p-4 [&_pre]:!overflow-x-auto',
        '[&_pre]:!border [&_pre]:!border-border',
        '[&_code]:!font-mono [&_code]:!text-sm',
        // Override shiki background with theme-aware colors
        '[&_pre]:!bg-muted'
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
