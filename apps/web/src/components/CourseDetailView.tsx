import React, { useState, useEffect } from 'react';
import { coursesService } from '../services/courses.service';
import type { CourseDetail, SessionPreviewData } from '../services/courses.service';
import { enrollmentsService } from '../services/enrollments.service';
import type { EnrollmentRecord } from '../services/enrollments.service';
import { formatDuration, levelColor } from '../utils/formatters';

interface CourseDetailViewProps {
  courseIdOrSlug: string;
  authenticated: boolean;
  onLogin: () => void;
  onBack: () => void;
  onStartLearning: (enrollmentId: string) => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  courseIdOrSlug,
  authenticated,
  onLogin,
  onBack,
  onStartLearning,
}) => {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<SessionPreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const detail = await coursesService.getCourse(courseIdOrSlug);
        if (!isMounted) return;
        setCourse(detail);

        if (authenticated) {
          // Check if already enrolled
          try {
            const myEnrollments = await enrollmentsService.getMyEnrollments();
            const existing = myEnrollments.enrollments.find(
              (e) => e.productId === detail.id || e.product?.slug === detail.slug
            );
            if (existing && isMounted) {
              setEnrollment(existing);
            }
          } catch {
            // Ignore enrollment check failure
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Failed to load course details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [courseIdOrSlug, authenticated]);

  const handleEnroll = async () => {
    if (!authenticated) {
      onLogin();
      return;
    }
    if (!course) return;

    setEnrolling(true);
    setError(null);
    try {
      const record = await enrollmentsService.enroll(course.id);
      setEnrollment(record);
      onStartLearning(record.id);
    } catch (err: any) {
      setError(err?.message || 'Enrollment failed. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleOpenPreview = async (sessionId: string) => {
    setLoadingPreview(true);
    try {
      const prevData = await coursesService.getCoursePreview(courseIdOrSlug, sessionId);
      setPreviewModal(prevData);
    } catch (err: any) {
      alert(err?.message || 'Failed to load preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-zinc-800 rounded" />
        <div className="h-64 bg-zinc-800 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-zinc-800 rounded-2xl" />
          <div className="h-64 bg-zinc-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-12 text-center rounded-3xl border border-rose-500/20 bg-rose-500/5 text-rose-300 space-y-4">
        <p className="text-base font-semibold">{error || 'Course not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-lg text-white"
        >
          ← Return to Catalog
        </button>
      </div>
    );
  }

  const allSessions = course.course.sections.flatMap((s) => s.sessions);
  const totalDuration = allSessions.reduce((acc, s) => acc + (s.video?.duration || 0), 0);
  const levelStyle = levelColor(course.course.level);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Breadcrumb */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span>
        <span>Back to Course Catalog</span>
      </button>

      {/* Hero Header */}
      <div className="relative rounded-3xl border border-[#272727] bg-[#181818] p-6 sm:p-10 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {course.course.category && (
                <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider border border-zinc-700">
                  {course.course.category.name}
                </span>
              )}
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
              >
                {course.course.level}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">
                Full Free Access
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug">
              {course.title}
            </h1>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
              {course.description || course.shortDescription || 'No description provided.'}
            </p>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#272727] text-xs text-zinc-400">
              <div>
                <span className="text-zinc-500">Curriculum:</span>{' '}
                <strong className="text-white font-semibold">
                  {course.course.sections.length} Sections · {allSessions.length} Lessons
                </strong>
              </div>
              <div>
                <span className="text-zinc-500">Video Duration:</span>{' '}
                <strong className="text-white font-semibold">{formatDuration(totalDuration)}</strong>
              </div>
              <div>
                <span className="text-zinc-500">Language:</span>{' '}
                <strong className="text-white font-semibold uppercase">{course.course.language || 'EN'}</strong>
              </div>
            </div>
          </div>

          {/* Enrollment Card */}
          <div className="rounded-2xl border border-[#333] bg-[#141414] p-6 space-y-5 shadow-xl">
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full aspect-video object-cover rounded-xl border border-zinc-800"
              />
            )}

            <div className="space-y-1">
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">Free</span>
                <span className="text-xs text-[#F3E700] font-semibold bg-[#F3E700]/10 px-2 py-0.5 rounded border border-[#F3E700]/30">
                  Includes Certificate
                </span>
              </div>
            </div>

            {enrollment ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-semibold">
                  ✓ You are enrolled in this course
                </div>
                <button
                  onClick={() => onStartLearning(enrollment.id)}
                  className="w-full py-3.5 rounded-xl bg-[#F3E700] hover:bg-[#e0d500] text-black font-extrabold text-sm transition shadow-[0_0_16px_rgba(243,231,0,0.3)] flex items-center justify-center gap-2"
                >
                  <span>Continue Learning</span>
                  <span>→</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full py-3.5 rounded-xl bg-[#F3E700] hover:bg-[#e0d500] text-black font-extrabold text-sm transition shadow-[0_0_16px_rgba(243,231,0,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {enrolling ? (
                  'Enrolling...'
                ) : (
                  <>
                    <span>Enroll Now for Free</span>
                    <span>→</span>
                  </>
                )}
              </button>
            )}

            <ul className="text-xs text-zinc-400 space-y-2 pt-2 border-t border-zinc-800">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Full lifetime access
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Access on mobile & desktop
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Verifiable Certificate of Completion
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Curriculum Outline & Instructor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Curriculum Sections */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">Course Curriculum</h2>
            <span className="text-xs text-zinc-400">
              {allSessions.length} Lessons ({formatDuration(totalDuration)})
            </span>
          </div>

          <div className="space-y-4">
            {course.course.sections.map((section, secIdx) => (
              <div
                key={section.id}
                className="rounded-2xl border border-[#272727] bg-[#181818] overflow-hidden"
              >
                <div className="p-4 sm:p-5 bg-zinc-900/60 border-b border-[#272727] flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[#F3E700] uppercase tracking-wider">
                      Section {secIdx + 1}
                    </span>
                    <h3 className="text-base font-bold text-white">{section.title}</h3>
                    {section.description && (
                      <p className="text-xs text-zinc-400">{section.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">
                    {section.sessions.length} {section.sessions.length === 1 ? 'lesson' : 'lessons'}
                  </span>
                </div>

                <div className="divide-y divide-[#272727]">
                  {section.sessions.map((session, sessIdx) => (
                    <div
                      key={session.id}
                      className="p-4 sm:px-5 flex items-center justify-between hover:bg-zinc-800/30 transition text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-mono text-[10px]">
                          {sessIdx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-200">{session.title}</p>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                            <span>{session.status}</span>
                            {session.video?.duration ? (
                              <>
                                <span>·</span>
                                <span>{formatDuration(session.video.duration)}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {(session.isPreview || session.isFree) && (
                          <button
                            onClick={() => handleOpenPreview(session.id)}
                            disabled={loadingPreview}
                            className="px-3 py-1 rounded-full bg-[#F3E700]/10 hover:bg-[#F3E700]/20 text-[#F3E700] border border-[#F3E700]/30 font-bold text-[11px] transition"
                          >
                            Preview Free 👁
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructor Card */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Your Instructor</h2>
          <div className="rounded-2xl border border-[#272727] bg-[#181818] p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F3E700] text-black font-extrabold text-xl flex items-center justify-center shadow-[0_0_16px_rgba(243,231,0,0.2)]">
                {course.course.author?.firstName?.charAt(0) || 'I'}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {course.course.author?.firstName} {course.course.author?.lastName || ''}
                </h3>
                <p className="text-xs text-[#F3E700] font-medium">Lead Course Author</p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {course.course.author?.bio ||
                'Passionate educator and engineer sharing production best practices and hands-on skills.'}
            </p>
          </div>
        </div>
      </div>

      {/* Free Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-[#141414] border border-[#333] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#F3E700] tracking-wider">
                  FREE PREVIEW LESSON
                </span>
                <h3 className="text-lg font-bold text-white">{previewModal.title}</h3>
              </div>
              <button
                onClick={() => setPreviewModal(null)}
                className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            {/* Video Player */}
            {previewModal.video?.vimeoVideoId ? (
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-zinc-800">
                <iframe
                  className="w-full h-full"
                  src={`https://player.vimeo.com/video/${previewModal.video.vimeoVideoId}?autoplay=1`}
                  title={previewModal.title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="p-8 text-center bg-zinc-900 rounded-xl text-zinc-400 text-sm">
                No video attached to this preview.
              </div>
            )}

            {/* Resources list */}
            {previewModal.resources && previewModal.resources.length > 0 && (
              <div className="pt-2 border-t border-zinc-800">
                <p className="text-xs font-semibold text-zinc-300 mb-2">Lesson Resources:</p>
                <div className="flex flex-wrap gap-2">
                  {previewModal.resources.map((res) => (
                    <a
                      key={res.id}
                      href={res.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 border border-zinc-700 flex items-center gap-1.5"
                    >
                      <span>📎</span>
                      <span>{res.title}</span>
                      <span className="text-[10px] text-zinc-500 uppercase">({res.type})</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
