import { useState } from 'react';
import type { FormEvent } from 'react';
import { contentClient as api } from '../services/apiClient';
import { useAuth } from '../auth/context';
import { Empty, ErrorNotice, Field, Modal, Pager, StatusBadge } from './ui';
import type { Course, CoursePage, ReviewPage, Submission } from './types';
import { Curriculum } from './Curriculum';
import { safeUrl, courseStatuses, navigate, statusLabel } from './helpers';
import { useLoad } from './useLoad';
import { CategoryFormModal } from './Categories';
import { toast } from 'sonner';



const managerRole = (roles: string[] = []) => roles.some(r => ['SUPER_ADMIN', 'MANAGER'].includes(r));

export function Dashboard() {
  const { user } = useAuth();
  const manager = managerRole(user?.roles);
  const result = useLoad(async () => {
    const [recent, ...counts] = await Promise.all([api.get<CoursePage>('/courses/manage', { params: { limit: 5 } }), ...(['DRAFT', 'IN_REVIEW', 'ON_AIR'] as const).map(status => api.get<CoursePage>('/courses/manage', { params: { limit: 1, status } }))]);
    return { recent, counts };
  }, []);
  return <><div className="page-heading"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.</h1><p>{manager ? 'A clear view of your academy. Keep great learning moving.' : 'Your next great course starts here. Let’s make it happen.'}</p></div><button className="btn" onClick={() => navigate('/courses/new')}>＋ Create a course</button></div>
    <ErrorNotice error={result.error} retry={result.reload} />
    <div className="stat-grid">{[{ label: manager ? 'All courses' : 'Your courses', status: '', value: result.data?.recent.total, note: 'Across your workspace' }, ...['DRAFT', 'IN_REVIEW', 'ON_AIR'].map((status, i) => ({ label: statusLabel(status), status, value: result.data?.counts[i].total, note: ['Ready for your next idea', 'In the review process', 'Available to learners'][i] }))].map(item => <a href={`#/courses${item.status ? `?status=${item.status}` : ''}`} className="stat-card" key={item.label}><span>{item.label}<span aria-hidden="true">↗</span></span><strong>{result.loading || result.error ? '—' : item.value}</strong><small>{item.note}</small></a>)}</div>
    <div className="dashboard-grid"><section className="panel"><div className="section-heading"><div><p className="eyebrow">COURSE LIBRARY</p><h2>Recent courses</h2></div><a className="text-button" href="#/courses">View all →</a></div>{result.loading ? <div className="loading">Loading courses…</div> : result.data?.recent.courses.length ? result.data.recent.courses.map(c => <a key={c.id} className="recent-course" href={`#/courses/${c.id}`}><div className="course-mark" aria-hidden="true">{c.title.charAt(0)}</div><div><strong>{c.title}</strong><small>{c.course?.category?.name || 'Uncategorized'} · {statusLabel(c.course?.level || 'BEGINNER')}</small></div><StatusBadge status={c.status} /><span className="muted" aria-hidden="true">↗</span></a>) : !result.error && <Empty title="Make room for your first course" action={<a href="#/courses/new" className="btn secondary">Create a course</a>}>Turn your expertise into a learning experience.</Empty>}</section>
    <aside className="panel workflow-card"><p className="eyebrow">FROM IDEA TO IMPACT</p><h2>Good learning.<br />One step at a time.</h2><ol>{[['01', 'Build your course', 'Shape the curriculum, add lessons, and check the details.'], ['02', 'Get a second pair of eyes', 'Submit your course for a manager’s review.'], ['03', 'Ready for your learners', 'Approved courses can be published by a manager.']].map(([n,t,d]) => <li key={n}><span>{n}</span><div><strong>{t}</strong><p>{d}</p></div></li>)}</ol>{manager && <a className="btn secondary" href="#/reviews">Open review queue →</a>}</aside></div>
  </>;
}

export function CoursesPage({ initialStatus = '', create = false }: { initialStatus?: string; create?: boolean }) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const result = useLoad(() => api.get<CoursePage>('/courses/manage', { params: { page, limit: 9, search: query, status } }), [page, query, status]);
  return <><div className="page-heading"><div><p className="eyebrow">COURSE LIBRARY</p><h1>{managerRole(user?.roles) ? 'All courses' : 'My courses'}<span className="heading-count">{result.data?.total ?? '—'}</span></h1><p>Build something worth learning. Manage every course in one place.</p></div><button className="btn" onClick={() => navigate('/courses/new')}>＋ Create a course</button></div>
    <div className="filter-tabs" aria-label="Course status filters"><button className={!status ? 'active' : ''} onClick={() => { setStatus(''); setPage(1); }}>All courses</button>{courseStatuses.map(s => <button className={status === s ? 'active' : ''} key={s} onClick={() => { setStatus(s); setPage(1); }}>{statusLabel(s)}</button>)}</div>
    <form className="toolbar" onSubmit={e => { e.preventDefault(); setQuery(search.trim()); setPage(1); }}><label className="search-field"><span aria-hidden="true">⌕</span><input aria-label="Search courses" placeholder="Search your courses…" value={search} onChange={e => setSearch(e.target.value)} /></label><button className="btn secondary">Search</button><button type="button" className="text-button" onClick={result.reload}>Refresh</button></form><ErrorNotice error={result.error} retry={result.reload} />
    {result.loading ? <div className="loading" role="status">Loading your courses…</div> : !result.error && result.data && <>{result.data.courses.length ? <div className="course-grid">{result.data.courses.map((c, index) => <a className="course-card" key={c.id} href={`#/courses/${c.id}`}><div className={`course-cover cover-${index % 4}`}>{safeUrl(c.thumbnail) ? <img src={safeUrl(c.thumbnail)} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} /> : <><span className="cover-symbol" aria-hidden="true">{['◈','◌','⌘','↗'][index % 4]}</span><span className="cover-title">{c.course?.category?.name || 'VIRTUA ACADEMY'}</span></>}<StatusBadge status={c.status} /></div><div className="course-card-body"><div className="course-meta">{statusLabel(c.course?.level || 'BEGINNER')}<span>·</span>{c.course?._count?.sections ?? 0} sections</div><h2>{c.title}</h2><p>{c.shortDescription || 'Add a short introduction to help learners discover this course.'}</p><div className="course-card-footer"><span>{managerRole(user?.roles) ? c.course?.author?.firstName || c.course?.author?.email || 'Instructor' : `Updated ${new Date(c.updatedAt).toLocaleDateString()}`}</span><span>Open course ↗</span></div></div></a>)}</div> : <Empty title={query || status ? 'No courses match your filters' : 'Your first course starts here'} action={<button className="btn secondary" onClick={() => navigate('/courses/new')}>Create a course</button>}>{query || status ? 'Try another search or select a different status.' : 'Start with a title. Add your curriculum and refine it as you go.'}</Empty>}<Pager page={page} pages={result.data.totalPages} total={result.data.total} onChange={setPage} /></>}
    {create && <CourseDetailsForm onClose={() => navigate('/courses')} onSaved={c => navigate(`/courses/${c.id}`)} />}
  </>;
}

function CourseDetailsForm({ course, onClose, onSaved }: { course?: Course; onClose: () => void; onSaved: (course: Course) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(course?.course.categoryId || '');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(course?.thumbnail || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const categories = useLoad(async () => {
    const items: { id: string; name: string }[] = []; let page = 1; let pages = 1;
    do { const response = await api.get<{ categories: { id: string; name: string }[]; totalPages: number }>('/categories/query', { params: { limit: 100, page } }); items.push(...response.categories); pages = response.totalPages; page++; } while (page <= pages);
    return items;
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<{ url: string }>('/courses/upload-thumbnail', formData);
      setThumbnailUrl(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload cover image');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const fields = Object.fromEntries(data) as Record<string, string>;
    setBusy(true);
    setError(null);
    try {
      const body = {
        ...fields,
        title: fields.title.trim(),
        description: fields.description !== undefined ? fields.description.trim() : undefined,
        shortDescription: fields.shortDescription !== undefined ? fields.shortDescription.trim() : undefined,
        thumbnail: thumbnailUrl.trim() || undefined,
        categoryId: selectedCategoryId || (course ? null : undefined),
      };
      const saved = course ? await api.put<Course>(`/courses/${course.id}`, body) : await api.post<Course>('/courses', body);
      toast.success(course ? 'Course details updated.' : 'Course created.', { description: course ? 'Your course information was saved.' : 'Your draft course is ready for curriculum setup.' });
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save course');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Modal title={course ? 'Edit course details' : 'Create a new course'} onClose={onClose} busy={busy || uploadingImage}>
        <p className="muted">Start with the essentials. You can keep refining your draft.</p>
        <form onSubmit={save}>
          <fieldset className="form-stack" disabled={busy || uploadingImage}>
            <Field label="Course title">
              <input name="title" autoFocus required maxLength={200} defaultValue={course?.title} placeholder="e.g. The complete guide to product design" />
            </Field>
            <Field label="Short introduction">
              <textarea name="shortDescription" rows={2} maxLength={500} defaultValue={course?.shortDescription} placeholder="What will learners take away?" />
            </Field>
            <Field label="Description">
              <textarea name="description" rows={4} defaultValue={course?.description} placeholder="Describe your audience, learning outcomes, and prerequisites." />
            </Field>
            <div className="form-grid">
              <Field label="Level">
                <select name="level" defaultValue={course?.course.level || 'BEGINNER'}>
                  {['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'].map(v => (
                    <option value={v} key={v}>{statusLabel(v)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Language">
                <input name="language" maxLength={10} defaultValue={course?.course.language || 'en'} required />
              </Field>
            </div>
            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Category</span>
                <button type="button" className="text-button" onClick={() => setAddingCategory(true)}>+ New category</button>
              </div>
              <select name="categoryId" value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} disabled={categories.loading || !!categories.error}>
                <option value="">Uncategorized</option>
                {categories.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <ErrorNotice error={categories.error} retry={categories.reload} />
            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Cover image</span>
                <label className="text-button" style={{ cursor: 'pointer', margin: 0 }}>
                  {uploadingImage ? 'Uploading…' : 'Upload image file'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={busy || uploadingImage}
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="url"
                  name="thumbnail"
                  value={thumbnailUrl}
                  onChange={e => setThumbnailUrl(e.target.value)}
                  placeholder="Paste image URL (https://…) or upload a file"
                  style={{ flex: 1 }}
                />
                <label className="btn secondary" style={{ cursor: 'pointer', margin: 0, padding: '10px 14px', whiteSpace: 'nowrap' }}>
                  {uploadingImage ? 'Uploading…' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={busy || uploadingImage}
                    onChange={handleImageUpload}
                  />
                </label>
                {thumbnailUrl && (
                  <button
                    type="button"
                    className="icon-button"
                    title="Clear image"
                    aria-label="Clear image"
                    onClick={() => setThumbnailUrl('')}
                  >
                    ×
                  </button>
                )}
              </div>
              <small style={{ color: '#888' }}>
                Paste a public image URL or upload directly from your device (JPG, PNG, WebP).
              </small>
              {thumbnailUrl && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={safeUrl(thumbnailUrl) || thumbnailUrl}
                    alt="Cover preview"
                    style={{
                      width: '96px',
                      height: '54px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid #383838',
                      background: '#1f1f1f',
                    }}
                    onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                  <span className="small muted">Cover preview</span>
                </div>
              )}
            </div>
            <ErrorNotice error={error} />
            <div className="dialog-actions">
              <button type="button" className="btn secondary" onClick={onClose} disabled={busy || uploadingImage}>Cancel</button>
              <button className="btn" disabled={busy || uploadingImage || categories.loading || !!categories.error}>
                {busy ? 'Saving…' : course ? 'Save changes' : 'Create draft'}
              </button>
            </div>
          </fieldset>
        </form>
      </Modal>
      {addingCategory && (
        <CategoryFormModal
          onClose={() => setAddingCategory(false)}
          onSaved={newCat => {
            setAddingCategory(false);
            categories.reload();
            setSelectedCategoryId(newCat.id);
          }}
        />
      )}
    </>
  );
}

export function ReviewQueue() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('PENDING');
  const result = useLoad(() => api.get<ReviewPage>('/course-publishing/review-queue', { params: { page, limit: 10, status } }), [page, status]);
  return <><div className="page-heading"><div><p className="eyebrow">QUALITY & PUBLISHING</p><h1>Course reviews</h1><p>A second pair of eyes before great learning goes live.</p></div></div><div className="filter-tabs">{['PENDING','APPROVED','CHANGES_REQUESTED'].map(s => <button className={status === s ? 'active' : ''} key={s} onClick={() => { setStatus(s); setPage(1); }}>{statusLabel(s)}</button>)}</div><ErrorNotice error={result.error} retry={result.reload} />{result.loading ? <div className="loading">Loading reviews…</div> : !result.error && result.data && <section className="panel">{result.data.submissions.map(s => <a className="recent-course review-row" href={`#/courses/${s.product?.id}`} key={s.id}><div className="course-mark" aria-hidden="true">◈</div><div><strong>{s.product?.title}</strong><small>{s.submittedBy?.firstName || s.submittedBy?.email} · Submitted {new Date(s.submittedAt).toLocaleDateString()}</small></div><StatusBadge status={s.status} /><span className="text-button">Review course →</span></a>)}{!result.data.submissions.length && <Empty title="No courses waiting here">Submitted courses will appear in this queue.</Empty>}<Pager page={page} pages={result.data.totalPages} total={result.data.total} onChange={setPage} /></section>}</>;
}

export function CourseWorkspace({ id }: { id: string }) {
  const { user } = useAuth();
  const result = useLoad(() => api.get<Course>(`/courses/manage/${id}`), [id]);
  const history = useLoad(() => api.get<Submission[]>(`/courses/${id}/publishing/submissions`), [id]);
  const [tab, setTab] = useState('curriculum');
  const [editing, setEditing] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const course = result.data;
  const refresh = () => { result.reload(); history.reload(); };
  if (result.loading) return <div className="loading" role="status">Opening course…</div>;
  if (result.error || !course) return <ErrorNotice error={result.error || 'Course not found'} retry={result.reload} />;
  const owner = course.course.authorId === user?.id;
  const editable = owner && ['DRAFT', 'CHANGES_REQUESTED'].includes(course.status);
  const manager = managerRole(user?.roles);
  const sections = course.course.sections || [];
  const sessions = sections.flatMap(s => s.sessions);
  const checks = [!!course.description?.trim(), sessions.length > 0, sessions.every(s => s.status !== 'VIDEO' || !!s.video?.vimeoVideoId)];
  const ready = checks.every(Boolean);
  const actionNames: Record<string, string> = { submit: 'Submit for review', approve: 'Approve course', 'request-changes': 'Request changes', publish: 'Publish course', unpublish: 'Unpublish course', archive: 'Archive course' };
  async function transition(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const note = String(new FormData(e.currentTarget).get('note') || '').trim();
    if (!action) return;
    const currentAction = action;
    setBusy(true);
    setError(null);
    try {
      await api.post(`/courses/${id}/publishing/${action}`, action === 'submit' ? { note } : { comment: note });
      setAction(null);
      if (currentAction === 'submit') {
        toast.success('Course status updated.', { description: 'Your course is under review. Content is fixed until the reviewer finishes.' });
      } else if (currentAction === 'approve') {
        toast.success('Course approved.', { description: 'Your course has been approved and is ready to be published.' });
      } else if (currentAction === 'request-changes') {
        toast.warning('Changes requested.', { description: 'Feedback and required changes have been sent to the author.' });
      } else if (currentAction === 'publish') {
        toast.success('Course published.', { description: 'This course is now live in the public catalog.' });
      } else if (currentAction === 'unpublish') {
        toast.info('Course unpublished.', { description: 'The course has returned to draft mode for editing.' });
      } else if (currentAction === 'archive') {
        toast.info('Course archived.', { description: 'The course has been archived.' });
      } else {
        toast.success('Course status updated.');
      }
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to update course status';
      setError(msg);
      toast.error('Status update failed.', { description: msg });
    } finally {
      setBusy(false);
    }
  }
  const actionButton = (key: string, primary = false) => <button className={`btn ${primary ? '' : 'secondary'}`} disabled={key === 'submit' && !ready} onClick={() => { setAction(key); setError(null); }}>{actionNames[key]}</button>;
  return <><a className="back-link" href="#/courses">← Course library</a><div className="page-heading course-heading"><div><div className="actions"><p className="eyebrow">COURSE WORKSPACE</p><StatusBadge status={course.status} /></div><h1>{course.title}</h1><p>{statusLabel(course.course.level)} · {sections.length} sections · {sessions.length} lessons</p></div><div className="actions">{editable && <button className="btn secondary" onClick={() => setEditing(true)}>Edit details</button>}{editable && actionButton('submit', true)}{manager && course.status === 'IN_REVIEW' && <>{actionButton('request-changes')}{actionButton('approve', true)}</>}{manager && course.status === 'APPROVED' && actionButton('publish', true)}{manager && course.status === 'ON_AIR' && actionButton('unpublish')}{manager && ['DRAFT','CHANGES_REQUESTED','APPROVED','ON_AIR'].includes(course.status) && actionButton('archive')}</div></div>
    {course.status === 'CHANGES_REQUESTED' && history.data?.[0]?.reviewComment && (
      <div className="notice warning">
        <strong>{owner ? 'Feedback from your reviewer' : 'Requested changes (sent to author)'}</strong>
        <p>{history.data[0].reviewComment}</p>
      </div>
    )}

    <div className="workspace-grid"><section><div className="filter-tabs">{['curriculum','details','preview','activity'].map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{statusLabel(t)}</button>)}</div>
    {tab === 'curriculum' && <Curriculum course={course} editable={editable} onSaved={refresh} />}
    {tab === 'details' && <div className="panel detail-panel"><div className="section-heading"><h2>Course details</h2>{editable && <button className="btn secondary" onClick={() => setEditing(true)}>Edit details</button>}</div><p className="eyebrow">INTRODUCTION</p><p className="prose">{course.shortDescription || 'No introduction yet.'}</p><p className="eyebrow">ABOUT THIS COURSE</p><p className="prose">{course.description || 'No description yet.'}</p><dl className="detail-grid"><div><dt>Category</dt><dd>{course.course.category?.name || 'Uncategorized'}</dd></div><div><dt>Language</dt><dd>{course.course.language || 'en'}</dd></div><div><dt>Instructor</dt><dd>{course.course.author?.firstName || course.course.author?.email}</dd></div><div><dt>Last updated</dt><dd>{new Date(course.updatedAt).toLocaleDateString()}</dd></div></dl></div>}
    {tab === 'preview' && <div className="panel detail-panel"><p className="eyebrow">CONTENT PREVIEW</p><h2>{course.title}</h2><p className="prose">{course.description}</p>{sections.map(section => <section key={section.id} className="preview-section"><h3>{section.title}</h3>{section.sessions.map(session => <details key={session.id}><summary>{session.title}<span className="tag">{statusLabel(session.status)}</span></summary><p className="prose">{session.description || 'No lesson description.'}</p>{session.video && /^\d+$/.test(session.video.vimeoVideoId) && <iframe className="video-preview" src={`https://player.vimeo.com/video/${session.video.vimeoVideoId}`} title={session.title} allow="fullscreen; picture-in-picture" allowFullScreen />}{session.resources.map(r => <p key={r.id}><a className="text-button" href={safeUrl(r.url)} target="_blank" rel="noreferrer">{r.title} ↗</a></p>)}{session.questionnaire && <div className="quiz-preview"><strong>{session.questionnaire.title}</strong>{session.questionnaire.questions.map(q => <div key={q.id}><p>{q.text}</p><ul>{q.options.map(o => <li key={o.id}>{o.text}{o.isCorrect ? ' ✓' : ''}</li>)}</ul></div>)}</div>}</details>)}</section>)}</div>}
    {tab === 'activity' && <section className="panel detail-panel"><h2>Review history</h2><ErrorNotice error={history.error} retry={history.reload} />{history.loading ? <div className="loading">Loading history…</div> : history.data?.length ? <ol className="timeline">{history.data.map(h => <li key={h.id}><StatusBadge status={h.status} /><p>{h.reviewComment || 'No notes added.'}</p><small>Submitted {new Date(h.submittedAt).toLocaleString()}{h.reviewedBy && ` · Reviewed by ${h.reviewedBy.firstName || h.reviewedBy.email}`}</small></li>)}</ol> : !history.error && <Empty title="A fresh start">Your submissions and review feedback will appear here.</Empty>}</section>}
    </section><aside className="panel course-checklist"><p className="eyebrow">BEFORE YOU SUBMIT</p><h2>Ready for review?</h2><p className="muted">Give your reviewer a complete learning experience.</p>{['Add a course description','Create at least one lesson','Attach a video to each video lesson'].map((label, i) => <div className="checklist-item" key={label}><span className={checks[i] ? 'done' : ''}>{checks[i] ? '✓' : '○'}</span>{label === 'Add a course description' && editable && !checks[i] ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>{label}<button type="button" className="text-button" style={{ fontSize: '0.82em', textDecoration: 'underline', padding: 0 }} onClick={() => setEditing(true)}>(Add now)</button></span> : label}</div>)}<div className="checklist-footer">{checks.filter(Boolean).length} of {checks.length} essentials complete</div><p className="muted small">Preview every lesson and check your resources before submitting.</p></aside></div>
    {editing && <CourseDetailsForm course={course} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); refresh(); }} />}
    {action && <Modal title={actionNames[action]} onClose={() => setAction(null)} busy={busy}><form onSubmit={transition}><fieldset className="form-stack" disabled={busy}><p className="muted">{action === 'submit' ? 'Your course will be read-only until a manager reviews it.' : action === 'publish' ? 'This course will become available in the published course catalog.' : action === 'unpublish' ? 'This course will return to draft so its author can make changes.' : action === 'archive' ? 'This course will be archived. It cannot be edited or republished through this workflow.' : 'Your decision and feedback will be visible to the author.'}</p>{['submit','approve','request-changes'].includes(action) && <Field label={action === 'request-changes' ? 'Required changes' : 'Notes (optional)'}><textarea name="note" rows={4} maxLength={action === 'submit' ? 1000 : 2000} required={action === 'request-changes'} /></Field>}<ErrorNotice error={error} /><div className="dialog-actions"><button type="button" className="btn secondary" onClick={() => setAction(null)}>Cancel</button><button className="btn">{busy ? 'Saving…' : actionNames[action]}</button></div></fieldset></form></Modal>}
  </>;
}


