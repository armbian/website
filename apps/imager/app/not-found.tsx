import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AmbientGlow } from '@/components/ambient-glow';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <AmbientGlow />

      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        <Image
          src="/icon-192.png"
          alt="Armbian"
          width={64}
          height={64}
          className="mb-6 rounded-2xl"
        />

        <span className="text-primary-500 mb-4 text-sm font-semibold tracking-widest uppercase">
          404
        </span>

        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">Page not found</h1>

        <p className="text-muted-foreground mb-8 max-w-md text-base">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Button variant="outline" size="lg" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
