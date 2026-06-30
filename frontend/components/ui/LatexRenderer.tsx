"use client";

import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LatexRendererProps {
    text: string;
    className?: string;
}

/**
 * Splits a string on LaTeX delimiters and renders math segments with KaTeX.
 * Handles:
 *   \( ... \)   inline math
 *   \[ ... \]   display (block) math
 *   $ ... $     inline math (common in OpenAI responses)
 *   $$ ... $$   display math
 */
export function LatexRenderer({ text, className }: LatexRendererProps) {
    const segments = parseLatex(text);

    return (
        <span className={className}>
            {segments.map((seg, i) => {
                if (seg.type === "text") {
                    return <span key={i}>{seg.content}</span>;
                }

                try {
                    const html = katex.renderToString(seg.content, {
                        throwOnError: false,
                        displayMode: seg.type === "block",
                        output: "html",
                    });
                    return seg.type === "block" ? (
                        <span
                            key={i}
                            className="block my-2 overflow-x-auto"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    ) : (
                        <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
                    );
                } catch {
                    // Fallback: render raw if KaTeX fails
                    return <span key={i}>{seg.content}</span>;
                }
            })}
        </span>
    );
}

type Segment =
    | { type: "text"; content: string }
    | { type: "inline"; content: string }
    | { type: "block"; content: string };

function parseLatex(input: string): Segment[] {
    const segments: Segment[] = [];
    // Order matters: check longer/more-specific delimiters first
    const pattern =
        /\\\[(.+?)\\\]|\\\((.+?)\\\)|\$\$(.+?)\$\$|\$(.+?)\$/gs;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(input)) !== null) {
        // Push any plain text before this match
        if (match.index > lastIndex) {
            segments.push({ type: "text", content: input.slice(lastIndex, match.index) });
        }

        if (match[1] !== undefined) {
            // \[ ... \]  — block
            segments.push({ type: "block", content: match[1].trim() });
        } else if (match[2] !== undefined) {
            // \( ... \)  — inline
            segments.push({ type: "inline", content: match[2].trim() });
        } else if (match[3] !== undefined) {
            // $$ ... $$  — block
            segments.push({ type: "block", content: match[3].trim() });
        } else if (match[4] !== undefined) {
            // $ ... $    — inline
            segments.push({ type: "inline", content: match[4].trim() });
        }

        lastIndex = pattern.lastIndex;
    }

    // Push any trailing plain text
    if (lastIndex < input.length) {
        segments.push({ type: "text", content: input.slice(lastIndex) });
    }

    return segments;
}