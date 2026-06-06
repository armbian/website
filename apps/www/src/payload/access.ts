import type { Access, FieldAccess } from 'payload';

export const anyone: Access = () => true;
export const authenticated: Access = ({ req: { user } }) => Boolean(user);
export const isAdmin: Access = ({ req: { user } }) => user?.role === 'admin';
export const isAdminOrEditor: Access = ({ req: { user } }) =>
  user?.role === 'admin' || user?.role === 'editor';
export const adminOrSelf: Access = ({ req: { user } }) => {
  if (user?.role === 'admin') return true;
  if (user) return { id: { equals: user.id } };
  return false;
};
export const adminOnlyField: FieldAccess = ({ req: { user } }) => user?.role === 'admin';
export const adminOrEditorField: FieldAccess = ({ req: { user } }) =>
  user?.role === 'admin' || user?.role === 'editor';

// Public reads see only published docs; authenticated staff see drafts too.
export const publishedOrAuthed: Access = ({ req: { user } }) =>
  user ? true : { status: { equals: 'published' } };
