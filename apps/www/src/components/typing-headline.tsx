'use client';

import { useState, useEffect, useCallback } from 'react';

const TYPE_SPEED = 80;
const DELETE_SPEED = 40;
const PAUSE_AFTER_TYPE = 2000;
const PAUSE_AFTER_DELETE = 300;

export function TypingHeadline({ phrases }: { phrases: string[] }) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const phrase = phrases[phraseIdx % phrases.length]!;

  const tick = useCallback(() => {
    if (!deleting) {
      if (text.length < phrase.length) {
        setText(phrase.slice(0, text.length + 1));
      } else {
        setTimeout(() => setDeleting(true), PAUSE_AFTER_TYPE);
        return;
      }
    } else {
      if (text.length > 0) {
        setText(text.slice(0, -1));
      } else {
        setDeleting(false);
        setPhraseIdx((i) => (i + 1) % phrases.length);
        return;
      }
    }
  }, [text, deleting, phrase, phrases.length]);

  useEffect(() => {
    const speed = deleting ? DELETE_SPEED : TYPE_SPEED;
    const timer = setTimeout(tick, text.length === 0 && !deleting ? PAUSE_AFTER_DELETE : speed);
    return () => clearTimeout(timer);
  }, [tick, text, deleting]);

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[rgb(var(--brand))] via-orange-400 to-yellow-500">
      {text}
      <span className="inline-block w-[3px] h-[0.9em] bg-[rgb(var(--brand))] ml-0.5 align-middle animate-pulse" />
    </span>
  );
}
