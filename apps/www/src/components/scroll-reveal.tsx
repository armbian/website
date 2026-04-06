'use client';

import { type ReactNode, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'motion/react';

type Direction = 'up' | 'down' | 'left' | 'right';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  once?: boolean;
}

const directionOffset: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
};

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 30,
  className,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-50px 0px' });
  const offset = directionOffset[direction];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        x: offset.x * distance,
        y: offset.y * distance,
        scale: 0.97,
        filter: 'blur(3px)',
      }}
      animate={isInView ? {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
      } : undefined}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/** Scroll-linked parallax */
export function ScrollParallax({
  children,
  className,
  amount = 20,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);

  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}

/** Animated counter */
export function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <>
      <motion.span
        ref={ref}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : undefined}
      >
        {isInView ? (
          <CountUpInner value={value} />
        ) : '0'}
      </motion.span>
      <span className="text-[rgb(var(--brand))]">{suffix}</span>
    </>
  );
}

function CountUpInner({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useRef({ current: 0 });

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      onAnimationStart={() => {
        const el = ref.current;
        if (!el) return;
        const start = performance.now();
        const dur = 2000;
        const animate = (now: number) => {
          const progress = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          motionValue.current.current = Math.round(eased * value);
          el.textContent = String(motionValue.current.current);
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }}
    >
      0
    </motion.span>
  );
}

export function ScrollRevealGroup({
  children,
  direction = 'up',
  stagger = 0.08,
  baseDelay = 0,
  duration = 0.6,
  distance = 30,
  className,
  once = true,
}: {
  children: ReactNode[];
  direction?: Direction;
  stagger?: number;
  baseDelay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <>
      {children.map((child, i) => (
        <ScrollReveal
          key={i}
          direction={direction}
          delay={baseDelay + i * stagger}
          duration={duration}
          distance={distance}
          className={className}
          once={once}
        >
          {child}
        </ScrollReveal>
      ))}
    </>
  );
}
