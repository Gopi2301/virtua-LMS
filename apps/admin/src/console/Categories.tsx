import { useState } from 'react';
import type { FormEvent } from 'react';
import { contentClient as api } from '../services/apiClient';
import { Empty, ErrorNotice, Field, Modal, Pager } from './ui';
import type { CategoryItem, CategoryPage } from './types';
import { useLoad } from './useLoad';

export function CategoryFormModal({
  category,
  onClose,
  onSaved,
}: {
  category?: CategoryItem | null;
  onClose: () => void;
  onSaved: (category: CategoryItem) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get('name') || '').trim();

    if (!name) return;

    setBusy(true);
    setError(null);

    try {
      // Send only name in payload
      const payload = { name };

      const result = category
        ? await api.put<CategoryItem>(`/categories/${category.id}`, payload)
        : await api.post<CategoryItem>('/categories', payload);

      onSaved(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save category');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={category ? 'Edit category' : 'Create a new category'}
      onClose={onClose}
      busy={busy}
    >
      <p className="muted">
        Categories help students discover courses by subject or topic.
      </p>
      <form onSubmit={save}>
        <fieldset className="form-stack" disabled={busy}>
          <Field label="Category name">
            <input
              name="name"
              autoFocus
              required
              maxLength={100}
              defaultValue={category?.name || ''}
              placeholder="e.g. Design & Creativity, Web Development, Business"
            />
          </Field>
          <ErrorNotice error={error} />
          <div className="dialog-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn" disabled={busy}>
              {busy ? 'Saving…' : category ? 'Save changes' : 'Create category'}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

export function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState<CategoryItem | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const result = useLoad(
    () =>
      api.get<CategoryPage>('/categories/query', {
        params: { page, limit: 10, search: query || undefined },
      }),
    [page, query]
  );

  async function handleDelete(category: CategoryItem) {
    setBusy(true);
    setDeleteError(null);
    try {
      await api.delete(`/categories/${category.id}`);
      setDeleting(null);
      setNotice(`Category "${category.name}" was deleted.`);
      result.reload();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Unable to delete category'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">WORKSPACE</p>
          <h1>Course categories</h1>
          <p>Organize courses into clear topics and learning tracks.</p>
        </div>
        <div className="actions">
          <button className="btn secondary" onClick={result.reload}>
            Refresh
          </button>
          <button className="btn" onClick={() => setCreating(true)}>
            + Create a category
          </button>
        </div>
      </div>

      {notice && (
        <div className="notice" role="status">
          {notice}
          <button
            className="text-button"
            style={{ marginLeft: 12 }}
            onClick={() => setNotice('')}
          >
            Dismiss
          </button>
        </div>
      )}

      <section className="panel">
        <form
          className="toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
            setPage(1);
          }}
        >
          <label className="search-field">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Search categories"
              placeholder="Search category name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button className="btn secondary">Search</button>
          {query && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setSearch('');
                setQuery('');
                setPage(1);
              }}
            >
              Clear filter
            </button>
          )}
        </form>

        <ErrorNotice error={result.error} retry={result.reload} />

        {result.loading ? (
          <div className="loading" role="status">
            Loading categories…
          </div>
        ) : !result.error && result.data ? (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Slug</th>
                    <th>Courses</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.categories.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                      </td>
                      <td>
                        <span className="tag">{c.slug}</span>
                      </td>
                      <td>
                        <strong>{c._count?.courses ?? 0}</strong>
                      </td>
                      <td>
                        <small>{new Date(c.createdAt).toLocaleDateString()}</small>
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            className="text-button"
                            onClick={() => setEditing(c)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-button danger"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleting(c);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!result.data.categories.length && (
              <Empty
                title={query ? 'No categories match your search' : 'No categories yet'}
                action={
                  <button
                    className="btn secondary"
                    onClick={() => setCreating(true)}
                  >
                    Create a category
                  </button>
                }
              >
                {query
                  ? 'Try searching with a different term.'
                  : 'Get started by creating categories to organize your course library.'}
              </Empty>
            )}

            <Pager
              page={page}
              pages={result.data.totalPages}
              total={result.data.total}
              onChange={setPage}
            />
          </>
        ) : null}
      </section>

      {creating && (
        <CategoryFormModal
          onClose={() => setCreating(false)}
          onSaved={(newCat) => {
            setCreating(false);
            setNotice(`Category "${newCat.name}" created successfully.`);
            result.reload();
          }}
        />
      )}

      {editing && (
        <CategoryFormModal
          category={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setEditing(null);
            setNotice(`Category "${updated.name}" updated successfully.`);
            result.reload();
          }}
        />
      )}

      {deleting && (
        <Modal
          title={`Delete "${deleting.name}"?`}
          onClose={() => !busy && setDeleting(null)}
          busy={busy}
        >
          <p>
            Are you sure you want to delete the category <strong>{deleting.name}</strong>?
          </p>
          <p className="muted" style={{ marginTop: 8 }}>
            {deleting._count?.courses
              ? `Warning: There are currently ${deleting._count.courses} course(s) linked to this category.`
              : 'This action cannot be undone.'}
          </p>
          <ErrorNotice error={deleteError} />
          <div className="dialog-actions">
            <button
              type="button"
              className="btn secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn destructive"
              disabled={busy}
              onClick={() => handleDelete(deleting)}
            >
              {busy ? 'Deleting…' : 'Delete category'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
