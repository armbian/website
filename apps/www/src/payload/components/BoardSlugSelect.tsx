'use client';

import { useEffect, useState } from 'react';
import { SelectInput, useField, FieldLabel } from '@payloadcms/ui';
import type { TextFieldClientComponent } from 'payload';

const API_URL = typeof window !== 'undefined'
  ? `${window.location.origin}/api/boards?limit=500&sort=name`
  : '';

interface Board {
  slug: string;
  name: string;
  vendor_name: string;
}

export const BoardSlugSelect: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path: path ?? field.name });
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!API_URL) return;
    fetch(API_URL)
      .then((r) => r.json())
      .then((res) => {
        const boards: Board[] = res.data ?? [];
        setOptions(
          boards.map((b) => ({
            label: `${b.name} (${b.vendor_name})`,
            value: b.slug,
          })),
        );
      })
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <FieldLabel label={field.label || field.name} required={field.required} path={path ?? field.name} />
      <SelectInput
        path={path ?? field.name}
        name={field.name}
        value={value}
        onChange={(opt: any) => setValue(typeof opt === 'string' ? opt : opt?.value ?? '')}
        options={
          loading
            ? [{ label: 'Loading boards...', value: '' }]
            : options
        }
        isClearable={false}
      />
    </div>
  );
};
