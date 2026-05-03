'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeUpVariants } from '@/lib/animation-variants';

interface MotionWrapperProps {
  children: ReactNode;
  variants?: Variants;
  className?: string;
}

export function MotionWrapper({
  children,
  variants = fadeUpVariants,
  className,
}: MotionWrapperProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
