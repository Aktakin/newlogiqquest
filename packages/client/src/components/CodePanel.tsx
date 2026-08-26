import { Fragment, useEffect, useRef } from 'react';
import type { Program } from '@logiq/engine';
import { toCodeLines } from '@logiq/engine';

const TOKEN = /(\/\/.*$)|\b(function|for|let|i)\b|\b(\d+)\b|([A-Za-z_][A-Za-z0-9_]*)(?=\()/g;

/** Deliberately small: enough colour to look like an editor, no parser needed. */
function highlight(text: string) {
  const parts: Array<{ text: string; cls: string }> = [];
  let cursor = 0;
  for (const match of text.matchAll(TOKEN)) {
    const at = match.index ?? 0;
    if (at > cursor) parts.push({ text: text.slice(cursor, at), cls: 'tok' });
    const [raw, comment, keyword, digits, call] = match;
    const cls = comment ? 'tok tok--comment'
      : keyword ? 'tok tok--keyword'
      : digits ? 'tok tok--number'
      : call ? 'tok tok--fn'
      : 'tok';
    parts.push({ text: raw, cls });
    cursor = at + raw.length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), cls: 'tok' });
  return parts;
}

interface CodePanelProps {
  program: Program;
  activeBlockId?: string | undefined;
  trail: string[];
}

export function CodePanel({ program, activeBlockId, trail }: CodePanelProps) {
  const lines = toCodeLines(program);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeBlockId]);

  return (
    <div className="code scroll">
      {lines.map((line, index) => {
        const isActive = !!line.blockId && line.blockId === activeBlockId;
        const inTrail = !!line.blockId && trail.includes(line.blockId);
        return (
          <div
            key={`${index}-${line.text}`}
            ref={isActive ? activeRef : undefined}
            className={`code__line${isActive ? ' code__line--active' : ''}${
              inTrail ? ' code__line--trail' : ''
            }`}
          >
            <span className="code__gutter">{index + 1}</span>
            <code className="code__text">
              {highlight(line.text).map((part, i) => (
                <Fragment key={i}>
                  <span className={part.cls}>{part.text}</span>
                </Fragment>
              ))}
            </code>
          </div>
        );
      })}
    </div>
  );
}
