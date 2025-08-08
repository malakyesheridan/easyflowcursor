"use client";

import React from "react";

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function Transcript({ text, keywords }: { text: string; keywords?: string[] }) {
  if (!text) return <p className="text-gray-500">(No transcript)</p>;
  const unique = Array.from(new Set((keywords || []).filter(Boolean))).slice(0, 20);
  if (unique.length === 0) return <p className="whitespace-pre-wrap">{text}</p>;

  const pattern = new RegExp(`(${unique.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <p className="whitespace-pre-wrap">
      {parts.map((part, idx) => {
        const match = unique.find((k) => k.toLowerCase() === part.toLowerCase());
        return match ? (
          <mark key={idx} className="bg-yellow-200 px-0.5 rounded-sm">{part}</mark>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        );
      })}
    </p>
  );
}