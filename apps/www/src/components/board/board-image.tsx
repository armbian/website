'use client';

import { useState, useRef, useEffect } from 'react';

interface BoardImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

function Placeholder() {
  return (
    <>
      <img
        src="/armbian-logo-white.png"
        alt="Armbian"
        width={120}
        height={32}
        className="w-auto h-8 object-contain opacity-20 hidden dark:block"
      />
      <img
        src="/armbian-logo-black.png"
        alt="Armbian"
        width={120}
        height={32}
        className="w-auto h-8 object-contain opacity-15 block dark:hidden"
      />
    </>
  );
}

export function BoardImage({ src, alt, className, width, height }: BoardImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  if (!src || failed) {
    return <Placeholder />;
  }

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-[rgb(var(--border))] border-t-[rgb(var(--brand))] animate-spin" />
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={
          className ??
          `hw-img h-full w-auto object-contain relative z-10 drop-shadow-lg transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`
        }
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </>
  );
}
