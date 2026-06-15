'use client';

import { useEffect, useMemo, useState } from 'react';
import { SelectInput, useField, FieldLabel, useAuth } from '@payloadcms/ui';
import type { TextFieldClientComponent } from 'payload';
import type { User } from '@/payload-types';

const API_URL =
  typeof window !== 'undefined' ? `${window.location.origin}/api/boards?limit=500&sort=name` : '';

interface Board {
  slug: string;
  name: string;
  vendor_name: string;
}

export const BoardSlugSelect: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path: path ?? field.name });
  const { user } = useAuth<User>();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!API_URL) return;
    fetch(API_URL)
      .then((r) => r.json())
      .then((res) => setBoards(res.data ?? []))
      .catch(() => setBoards([]))
      .finally(() => setLoading(false));
  }, []);

  // Maintainers may only target their assigned boards; admins/editors see all.
  const options = useMemo(() => {
    const allowed =
      user?.role === 'maintainer'
        ? new Set((user.assignedBoards ?? []).map((b) => b.boardSlug))
        : null;
    return boards
      .filter((b) => !allowed || allowed.has(b.slug))
      .map((b) => ({ label: `${b.name} (${b.vendor_name})`, value: b.slug }));
  }, [boards, user]);

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <FieldLabel
        label={field.label || field.name}
        required={field.required}
        path={path ?? field.name}
      />
      <SelectInput
        path={path ?? field.name}
        name={field.name}
        value={value}
        onChange={(opt: any) => setValue(typeof opt === 'string' ? opt : (opt?.value ?? ''))}
        options={loading ? [{ label: 'Loading boards...', value: '' }] : options}
        isClearable={false}
      />
    </div>
  );
};
