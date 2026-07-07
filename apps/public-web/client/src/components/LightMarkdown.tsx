import React, { type ReactNode } from "react";

type LightMarkdownProps = {
  children: string;
};

const inlineTokenPattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function isSafeHref(href: string) {
  return /^(https?:\/\/|mailto:|tel:|#|\/)/i.test(href);
}

function renderInline(text: string): ReactNode[] {
  return text.split(inlineTokenPattern).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-black/20 px-1 py-0.5 text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      if (!isSafeHref(href)) return label;

      return (
        <a
          key={index}
          href={href}
          className="font-medium underline underline-offset-4"
          rel={href.startsWith("http") ? "noreferrer" : undefined}
          target={href.startsWith("http") ? "_blank" : undefined}
        >
          {label}
        </a>
      );
    }

    return part;
  });
}

export default function LightMarkdown({ children }: LightMarkdownProps) {
  const blocks = children.trim().split(/\n{2,}/).filter(Boolean);

  if (blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").map((line) => line.trimEnd()).filter(Boolean);
        const heading = lines.length === 1 ? lines[0].match(/^(#{1,3})\s+(.+)$/) : null;

        if (heading) {
          const level = heading[1].length;
          const className = "font-semibold leading-snug";
          if (level === 1) return <h3 key={blockIndex} className={className}>{renderInline(heading[2])}</h3>;
          if (level === 2) return <h4 key={blockIndex} className={className}>{renderInline(heading[2])}</h4>;
          return <h5 key={blockIndex} className={className}>{renderInline(heading[2])}</h5>;
        }

        if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
          return (
            <ul key={blockIndex} className="my-1 list-disc space-y-1 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInline(line.replace(/^\s*[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
          return (
            <ol key={blockIndex} className="my-1 list-decimal space-y-1 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInline(line.replace(/^\s*\d+[.)]\s+/, ""))}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={blockIndex} className="whitespace-pre-wrap">
            {renderInline(lines.join("\n"))}
          </p>
        );
      })}
    </>
  );
}
