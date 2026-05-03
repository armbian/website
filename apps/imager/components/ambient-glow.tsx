export function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute top-0 left-1/2 h-[800px] w-[1000px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-primary-500/[0.07] blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 h-[400px] w-[600px] translate-y-1/4 rounded-full bg-primary-500/[0.04] blur-[100px]" />
    </div>
  );
}
