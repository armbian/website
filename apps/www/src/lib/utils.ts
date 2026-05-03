type ClassValue = string | number | boolean | null | undefined | false | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const v of inputs) {
    if (!v) continue;
    if (Array.isArray(v)) {
      const inner = cn(...v);
      if (inner) out.push(inner);
    } else if (typeof v === 'string' || typeof v === 'number') {
      out.push(String(v));
    }
  }
  return out.join(' ');
}
