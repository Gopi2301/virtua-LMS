import { useState } from 'react';
import type { FormEvent } from 'react';
import { contentClient as api } from '../services/apiClient';
import type { Course, Question, Questionnaire, Section, Session } from './types';
import { Empty, ErrorNotice, Field, Modal } from './ui';
import { safeUrl, statusLabel } from './helpers';
import { toast } from 'sonner';

type Editor = { kind: 'section'; section?: Section } | { kind: 'session'; section: Section; session?: Session } | { kind: 'video' | 'resource' | 'quiz'; session: Session } | { kind: 'question'; quiz: Questionnaire; question?: Question };
export function Curriculum({ course, editable, onSaved }: { course: Course; editable: boolean; onSaved: () => void }) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [removing, setRemoving] = useState<{ endpoint: string; label: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sections = course.course.sections || [];
  async function move(endpoint: string, position: number) { setBusy(true); setError(null); try { await api.patch(endpoint, { position }); onSaved(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to reorder'); } finally { setBusy(false); } }
  const removeButton = (endpoint: string, label: string) => <button className="text-button danger" disabled={busy} onClick={() => { setRemoving({ endpoint, label }); setError(null); }}>Remove</button>;
  return <><div className="section-heading curriculum-heading"><div><h2>Your curriculum</h2><p>Organize your knowledge into sections and lessons.</p></div>{editable && <button className="btn secondary" onClick={() => setEditor({ kind: 'section' })}>＋ Add section</button>}</div><ErrorNotice error={error} />
    {!sections.length && <Empty title="Give your course a little structure" action={editable && <button className="btn" onClick={() => setEditor({ kind: 'section' })}>Add your first section</button>}>Sections group related lessons and help learners find their way.</Empty>}
    <div className="curriculum-list">{sections.map((section, si) => <section className="panel curriculum-section" key={section.id}><div className="section-heading"><div className="section-title"><span className="section-number">{String(si + 1).padStart(2, '0')}</span><div><h3>{section.title}</h3><p>{section.sessions.length} lessons{section.description ? ` · ${section.description}` : ''}</p></div></div>{editable && <div className="actions"><button className="icon-button" aria-label={`Move ${section.title} up`} disabled={busy || si === 0} onClick={() => void move(`/sections/${section.id}`, sections[si - 1].position)}>↑</button><button className="icon-button" aria-label={`Move ${section.title} down`} disabled={busy || si === sections.length - 1} onClick={() => void move(`/sections/${section.id}`, sections[si + 1].position)}>↓</button><button className="text-button" onClick={() => setEditor({ kind: 'section', section })}>Edit</button>{removeButton(`/sections/${section.id}`, section.title)}</div>}</div>
    {section.sessions.map((session, li) => <details className="lesson" key={session.id}><summary><span className="lesson-icon" aria-hidden="true">{session.status === 'VIDEO' ? '▷' : '≡'}</span><span>{session.title}<small>{statusLabel(session.status)}{session.video?.duration ? ` · ${Math.ceil(session.video.duration / 60)} min` : ''}{session.isPreview ? ' · Preview' : ''}</small></span><span aria-hidden="true">⌄</span></summary><div className="lesson-content"><p className="prose">{session.description || 'Add a lesson description to introduce this topic.'}</p>{editable && <div className="actions"><button className="btn secondary" onClick={() => setEditor({ kind: 'session', section, session })}>Edit lesson</button><button className="icon-button" aria-label={`Move ${session.title} up`} disabled={busy || li === 0} onClick={() => void move(`/sessions/${session.id}`, section.sessions[li - 1].position)}>↑</button><button className="icon-button" aria-label={`Move ${session.title} down`} disabled={busy || li === section.sessions.length - 1} onClick={() => void move(`/sessions/${session.id}`, section.sessions[li + 1].position)}>↓</button>{removeButton(`/sessions/${session.id}`, session.title)}</div>}
      <div className="lesson-asset"><div><strong>Video</strong><p>{session.video ? `Vimeo ${session.video.vimeoVideoId} · ${statusLabel(session.video.status)}` : 'No video attached'}</p></div>{editable && <div className="actions"><button className="text-button" onClick={() => setEditor({ kind: 'video', session })}>{session.video ? 'Edit video' : 'Attach video'}</button>{session.video && removeButton(`/videos/${session.id}`, 'this video attachment')}</div>}</div>
      <div className="lesson-asset"><div><strong>Resources</strong><p>Supporting files and links for this lesson.</p></div>{editable && <button className="text-button" onClick={() => setEditor({ kind: 'resource', session })}>＋ Add resource</button>}</div>{session.resources.map(resource => <div className="resource-row" key={resource.id}><a href={safeUrl(resource.url)} target="_blank" rel="noreferrer">{resource.title} <span className="tag">{resource.type}</span> ↗</a>{editable && removeButton(`/resources/${resource.id}`, resource.title)}</div>)}
      <div className="lesson-asset"><div><strong>{session.questionnaire?.title || 'Knowledge check'}</strong><p>{session.questionnaire ? `${session.questionnaire.questions.length} questions · Pass score ${session.questionnaire.passingScore}%` : 'Help learners put their understanding to the test.'}</p></div>{editable && <div className="actions"><button className="text-button" onClick={() => setEditor({ kind: 'quiz', session })}>{session.questionnaire ? 'Settings' : '＋ Add questionnaire'}</button>{session.questionnaire && removeButton(`/questionnaires/${session.questionnaire.id}`, session.questionnaire.title)}</div>}</div>
      {session.questionnaire && <div className="question-list">{session.questionnaire.questions.map((q, qi) => <div className="question-card" key={q.id}><div className="section-heading"><strong>{qi + 1}. {q.text}</strong>{editable && <div className="actions"><button className="text-button" onClick={() => setEditor({ kind: 'question', quiz: session.questionnaire!, question: q })}>Edit</button>{removeButton(`/questionnaires/${session.questionnaire!.id}/questions/${q.id}`, 'this question')}</div>}</div><ul>{q.options.map(o => <li key={o.id} className={o.isCorrect ? 'correct-answer' : ''}>{o.isCorrect ? '✓ ' : '○ '}{o.text}</li>)}</ul>{q.explanation && <small>{q.explanation}</small>}</div>)}{editable && <button className="btn secondary" onClick={() => setEditor({ kind: 'question', quiz: session.questionnaire! })}>＋ Add question</button>}</div>}
    </div></details>)}{editable && <button className="add-lesson" onClick={() => setEditor({ kind: 'session', section })}>＋ Add lesson</button>}
    </section>)}</div>
    {editor && <ContentEditor editor={editor} courseId={course.id} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); onSaved(); }} />}
    {removing && <Modal title="Remove course content?" onClose={() => setRemoving(null)} busy={busy}><p>Remove <strong>{removing.label}</strong>? Any content inside it will also be removed. This cannot be undone.</p><ErrorNotice error={error} /><div className="dialog-actions"><button className="btn secondary" disabled={busy} onClick={() => setRemoving(null)}>Cancel</button><button className="btn destructive" disabled={busy} onClick={async () => { setBusy(true); setError(null); try { await api.delete(removing.endpoint); toast.info('Content removed.', { description: `"${removing.label}" was deleted.` }); setRemoving(null); onSaved(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to remove content'); } finally { setBusy(false); } }}>{busy ? 'Removing…' : 'Remove content'}</button></div></Modal>}
  </>;
}

function ContentEditor({ editor, courseId, onClose, onSaved }: { editor: Editor; courseId: string; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const question = editor.kind === 'question' ? editor.question : undefined;
  const [questionType, setQuestionType] = useState(question?.type || 'MULTIPLE_CHOICE');
  const [options, setOptions] = useState(question?.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })) || [{ text: '', isCorrect: true }, { text: '', isCorrect: false }]);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceType, setResourceType] = useState('PDF');
  const [resourceUrl, setResourceUrl] = useState('');
  const [uploadingResource, setUploadingResource] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);

  async function handleResourceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const lowerName = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lowerName);
    const isPdf = file.type.includes('pdf') || lowerName.endsWith('.pdf');
    const isZip = /(zip|compressed|tar|archive)/i.test(file.type) || /\.(zip|tar|gz|7z|rar)$/i.test(lowerName);

    if (resourceType === 'PDF' && (isImage || !isPdf)) {
      setError(`Cannot upload "${file.name}" as a PDF resource. Please upload a .pdf document or change the resource type.`);
      e.target.value = '';
      return;
    }

    if (resourceType === 'ZIP' && (isImage || !isZip)) {
      setError(`Cannot upload "${file.name}" as a ZIP archive. Please upload an archive file (.zip/.tar) or change the resource type.`);
      e.target.value = '';
      return;
    }

    setUploadingResource(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('expectedType', resourceType);
      const res = await api.post<{
        url: string;
        fileName: string;
        fileSize: number;
        resourceType: string;
      }>('/resources/upload-file', formData);
      setResourceUrl(res.url);
      setUploadedFile({ name: res.fileName, size: res.fileSize });
      if (!resourceTitle.trim()) {
        setResourceTitle(res.fileName.replace(/\.[^/.]+$/, ''));
      }
      if (['PDF', 'ZIP'].includes(res.resourceType)) {
        setResourceType(res.resourceType);
      }
      toast.success('Upload complete.', { description: `${res.fileName} (${Math.round(res.fileSize / 1024)} KB)` });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload file');
    } finally {
      setUploadingResource(false);
      e.target.value = '';
    }
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget); const text = (key: string) => String(form.get(key) || '').trim();
    setBusy(true); setError(null);
    try {
      if (editor.kind === 'section') {
        const body = { title: text('title'), description: text('description') };
        if (editor.section) await api.patch(`/sections/${editor.section.id}`, body); else await api.post('/sections', { ...body, courseId });
        toast.success(editor.section ? 'Section updated.' : 'Section created.');
      } else if (editor.kind === 'session') {
        const body = { title: text('title'), description: text('description'), type: text('type'), isPreview: form.has('isPreview'), isFree: form.has('isFree') };
        if (editor.session) await api.patch(`/sessions/${editor.session.id}`, body); else await api.post('/sessions', { ...body, sectionId: editor.section.id });
        toast.success(editor.session ? 'Lesson updated.' : 'Lesson created.');
      } else if (editor.kind === 'video') {
        const body = { vimeoVideoId: text('vimeoVideoId'), duration: Number(form.get('duration')), status: 'READY' };
        if (editor.session.video) await api.patch(`/videos/${editor.session.id}`, body); else await api.post('/videos', { ...body, sessionId: editor.session.id });
        toast.success('Video attached.');
      } else if (editor.kind === 'resource') {
        const finalUrl = resourceUrl.trim() || text('url');
        const lowerUrl = finalUrl.toLowerCase().split('?')[0];
        const isImageUrl = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lowerUrl);
        if (resourceType === 'PDF' && isImageUrl) {
          throw new Error('Cannot use an image file as a PDF resource. Please upload a PDF file or change the resource type.');
        }
        if (resourceType === 'ZIP' && isImageUrl) {
          throw new Error('Cannot use an image file as a ZIP archive resource. Please upload an archive file or change the resource type.');
        }

        await api.post('/resources', {
          sessionId: editor.session.id,
          title: resourceTitle.trim() || text('title'),
          type: resourceType,
          url: finalUrl,
          fileName: uploadedFile?.name,
          fileSize: uploadedFile?.size,
        });
        toast.success('Resource added.');
      } else if (editor.kind === 'quiz') {
        const body = { title: text('title'), passingScore: Number(form.get('passingScore')), maxAttempts: Number(form.get('maxAttempts')) };
        if (editor.session.questionnaire) await api.patch(`/questionnaires/${editor.session.questionnaire.id}`, body); else await api.post('/questionnaires', { ...body, sessionId: editor.session.id });
        toast.success('Questionnaire saved.');
      } else if (editor.kind === 'question') {
        const correct = options.filter(o => o.isCorrect).length;
        if (options.some(o => !o.text.trim()) || !correct || (questionType !== 'MULTIPLE_SELECT' && correct !== 1)) throw new Error('Add text to every answer and select the correct answer(s). Single-choice questions need exactly one correct answer.');
        const body = { text: text('text'), explanation: text('explanation'), type: questionType, options: options.map((o, position) => ({ ...o, text: o.text.trim(), position })) };
        if (editor.question) await api.patch(`/questionnaires/${editor.quiz.id}/questions/${editor.question.id}`, body); else await api.post(`/questionnaires/${editor.quiz.id}/questions`, body);
        toast.success(editor.question ? 'Question updated.' : 'Question added.');
      }
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save content'); }
    finally { setBusy(false); }
  }
  const names = { section: 'Course section', session: 'Lesson details', video: 'Vimeo video', resource: 'Add resource', quiz: 'Questionnaire settings', question: question ? 'Edit question' : 'Add question' };
  const resourceAccept =
    resourceType === 'PDF'
      ? '.pdf,application/pdf'
      : resourceType === 'ZIP'
      ? '.zip,.tar,.gz,.7z,.rar,application/zip,application/x-zip-compressed'
      : undefined;

  return <Modal title={names[editor.kind]} onClose={onClose} busy={busy || uploadingResource}><form onSubmit={save}><fieldset disabled={busy || uploadingResource} className="form-stack">
    {editor.kind === 'section' && <><Field label="Section title"><input name="title" required maxLength={200} defaultValue={editor.section?.title} autoFocus placeholder="e.g. Getting started" /></Field><Field label="Description"><textarea name="description" rows={3} defaultValue={editor.section?.description} /></Field></>}
    {editor.kind === 'session' && <><Field label="Lesson title"><input name="title" required maxLength={200} defaultValue={editor.session?.title} autoFocus /></Field><Field label="Description / lesson text"><textarea name="description" rows={6} defaultValue={editor.session?.description} /></Field><Field label="Lesson type"><select name="type" defaultValue={editor.session?.status || 'VIDEO'}><option value="VIDEO">Video</option><option value="TEXT">Text</option><option value="LIVE">Live</option></select></Field><label className="check-card"><input type="checkbox" name="isPreview" defaultChecked={editor.session?.isPreview} />Available as a course preview</label><label className="check-card"><input type="checkbox" name="isFree" defaultChecked={editor.session?.isFree} />Free lesson</label></>}
    {editor.kind === 'video' && <><p className="muted">Attach a video already uploaded to your Vimeo account. Ensure its privacy settings allow playback on your academy domain.</p><Field label="Vimeo video ID" hint="The numeric ID from the Vimeo video URL."><input name="vimeoVideoId" required pattern="[0-9]+" defaultValue={editor.session.video?.vimeoVideoId} placeholder="e.g. 123456789" /></Field><Field label="Duration (seconds)"><input name="duration" type="number" min={0} step={1} defaultValue={editor.session.video?.duration || 0} required /></Field></>}
    {editor.kind === 'resource' && <>
      <Field label="Resource title">
        <input
          name="title"
          required
          maxLength={200}
          value={resourceTitle}
          onChange={e => setResourceTitle(e.target.value)}
          placeholder="e.g. Lesson Cheatsheet or Starter Code"
          autoFocus
        />
      </Field>
      <Field label="Resource type">
        <select
          name="type"
          value={resourceType}
          onChange={e => {
            const next = e.target.value;
            setResourceType(next);
            if (next === 'PDF' && uploadedFile && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(uploadedFile.name)) {
              setError(`"${uploadedFile.name}" is an image and cannot be saved as a PDF resource. Please upload a PDF file.`);
            } else {
              setError(null);
            }
          }}
        >
          <option value="PDF">PDF</option>
          <option value="ZIP">ZIP archive</option>
          <option value="GITHUB">GitHub repository</option>
          <option value="EXTERNAL_LINK">External link</option>
        </select>
      </Field>
      <div className="field">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Resource file or URL</span>
          <label className="text-button" style={{ cursor: 'pointer', margin: 0 }}>
            {uploadingResource ? 'Uploading…' : '+ Upload file'}
            <input
              type="file"
              accept={resourceAccept}
              style={{ display: 'none' }}
              disabled={busy || uploadingResource}
              onChange={handleResourceUpload}
            />
          </label>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="url"
            name="url"
            required
            value={resourceUrl}
            onChange={e => {
              setResourceUrl(e.target.value);
              setUploadedFile(null);
            }}
            placeholder={resourceType === 'PDF' ? 'Paste PDF URL (https://… .pdf) or upload a PDF' : 'Paste URL (https://…) or upload a file'}
            style={{ flex: 1 }}
          />
          <label className="btn secondary" style={{ cursor: 'pointer', margin: 0, padding: '10px 14px', whiteSpace: 'nowrap' }}>
            {uploadingResource ? 'Uploading…' : 'Upload'}
            <input
              type="file"
              accept={resourceAccept}
              style={{ display: 'none' }}
              disabled={busy || uploadingResource}
              onChange={handleResourceUpload}
            />
          </label>
          {resourceUrl && (
            <button
              type="button"
              className="icon-button"
              title="Clear URL"
              aria-label="Clear URL"
              onClick={() => {
                setResourceUrl('');
                setUploadedFile(null);
                setError(null);
              }}
            >
              ×
            </button>
          )}
        </div>
        <small style={{ color: '#888' }}>
          {resourceType === 'PDF'
            ? 'Upload a PDF file or link directly to a hosted PDF.'
            : resourceType === 'ZIP'
            ? 'Upload a ZIP archive (.zip, .tar) or link directly to an archive.'
            : 'Upload files (PDF, ZIP, code) or provide a link to GitHub or an external website.'}
        </small>
        {uploadedFile && (
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="tag">{resourceType}</span>
            <span className="small muted">
              {uploadedFile.name} {uploadedFile.size ? `(${Math.round(uploadedFile.size / 1024)} KB)` : ''}
            </span>
          </div>
        )}
      </div>
    </>}
    {editor.kind === 'quiz' && <><Field label="Questionnaire title"><input name="title" required maxLength={200} defaultValue={editor.session.questionnaire?.title} autoFocus /></Field><div className="form-grid"><Field label="Passing score (%)"><input name="passingScore" type="number" min={0} max={100} required defaultValue={editor.session.questionnaire?.passingScore ?? 70} /></Field><Field label="Attempt limit" hint="0 means unlimited attempts."><input name="maxAttempts" type="number" min={0} required defaultValue={editor.session.questionnaire?.maxAttempts ?? 0} /></Field></div></>}
    {editor.kind === 'question' && <><Field label="Question"><textarea name="text" rows={3} required defaultValue={question?.text} autoFocus /></Field><Field label="Question type"><select value={questionType} onChange={e => { const type = e.target.value; setQuestionType(type); setOptions(type === 'TRUE_FALSE' ? [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }] : options.map((o, i) => ({ ...o, isCorrect: i === 0 }))); }}><option value="MULTIPLE_CHOICE">Single choice</option><option value="MULTIPLE_SELECT">Multiple select</option><option value="TRUE_FALSE">True / false</option></select></Field><div className="form-stack"><p className="muted">Select the correct answer{questionType === 'MULTIPLE_SELECT' ? 's' : ''}.</p>{options.map((option, i) => <div className="answer-editor" key={i}><input type={questionType === 'MULTIPLE_SELECT' ? 'checkbox' : 'radio'} name="correct-answer" aria-label={`Answer ${i + 1} is correct`} checked={option.isCorrect} onChange={e => setOptions(options.map((o, index) => ({ ...o, isCorrect: index === i ? e.target.checked : questionType === 'MULTIPLE_SELECT' ? o.isCorrect : false })))} /><input aria-label={`Answer ${i + 1}`} required value={option.text} readOnly={questionType === 'TRUE_FALSE'} onChange={e => setOptions(options.map((o, index) => index === i ? { ...o, text: e.target.value } : o))} placeholder={`Answer ${i + 1}`} />{options.length > 2 && <button type="button" className="icon-button" aria-label={`Remove answer ${i + 1}`} onClick={() => setOptions(options.filter((_, index) => index !== i))}>×</button>}</div>)}{questionType !== 'TRUE_FALSE' && options.length < 8 && <button type="button" className="text-button" onClick={() => setOptions([...options, { text: '', isCorrect: false }])}>＋ Add answer</button>}</div><Field label="Answer explanation"><textarea name="explanation" rows={2} defaultValue={question?.explanation} /></Field></>}
    <ErrorNotice error={error} /><div className="dialog-actions"><button type="button" className="btn secondary" onClick={onClose} disabled={busy || uploadingResource}>Cancel</button><button className="btn" disabled={busy || uploadingResource}>{busy ? 'Saving…' : 'Save changes'}</button></div></fieldset></form></Modal>;
}

