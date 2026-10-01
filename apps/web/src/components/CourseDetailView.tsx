import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Play,
  X,
} from "@virtua-lms/ui";
import { LearningDialog } from "./LearningUI";
import React, { useState, useEffect } from "react";
import { coursesService } from "../services/courses.service";
import type {
  CourseDetail,
  SessionPreviewData,
} from "../services/courses.service";
import { enrollmentsService } from "../services/enrollments.service";
import type { EnrollmentRecord } from "../services/enrollments.service";
import { formatDuration } from "../utils/formatters";

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
  const [previewModal, setPreviewModal] = useState<SessionPreviewData | null>(
    null,
  );
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
              (e) =>
                e.productId === detail.id || e.product?.slug === detail.slug,
            );
            if (existing && isMounted) {
              setEnrollment(existing);
            }
          } catch {
            // Ignore enrollment check failure
          }
        }
      } catch (err: any) {
        if (isMounted)
          setError(err?.message || "Failed to load course details");
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
      setError(err?.message || "Enrollment failed. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleOpenPreview = async (sessionId: string) => {
    setLoadingPreview(true);
    try {
      const prevData = await coursesService.getCoursePreview(
        courseIdOrSlug,
        sessionId,
      );
      setPreviewModal(prevData);
    } catch (err: any) {
      alert(err?.message || "Failed to load preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-zinc-800 rounded" />
        <div className="h-64 bg-zinc-800 rounded-md" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-zinc-800 rounded-md" />
          <div className="h-64 bg-zinc-800 rounded-md" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-12 text-center rounded-md border border-rose-500/20 bg-rose-500/5 text-rose-300 space-y-4">
        <p className="text-base font-semibold">{error || "Course not found"}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold rounded-md text-white"
        >
          ← Return to Catalog
        </button>
      </div>
    );
  }

  const allSessions = course.course.sections.flatMap((s) => s.sessions);
  const totalDuration = allSessions.reduce(
    (acc, s) => acc + (s.video?.duration || 0),
    0,
  );

  return (
    <div className="course-detail space-y-8 ">
      {/* Breadcrumb */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition group"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Back to Course Catalog</span>
      </button>

      {/* Hero Header */}
      <div className="course-detail-heading">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {course.course.category && (
                <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-sm font-bold   border border-zinc-700">
                  {course.course.category.name}
                </span>
              )}
              <span className="text-sm text-[var(--color-text-secondary)]">
                {course.course.level.replaceAll("_", " ").toLowerCase()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-2xl font-semibold text-white tracking-tight leading-snug">
              {course.title}
            </h1>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
              {course.description ||
                course.shortDescription ||
                "No description provided."}
            </p>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[var(--color-surface-elevated-alt)] text-sm text-zinc-400">
              <div>
                <span className="text-[var(--color-text-secondary)]">
                  Curriculum:
                </span>{" "}
                <strong className="text-white font-semibold">
                  {course.course.sections.length} Sections ·{" "}
                  {allSessions.length} Lessons
                </strong>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)]">
                  Video Duration:
                </span>{" "}
                <strong className="text-white font-semibold">
                  {formatDuration(totalDuration)}
                </strong>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)]">
                  Language:
                </span>{" "}
                <strong className="text-white font-semibold ">
                  {course.course.language || "EN"}
                </strong>
              </div>
            </div>
          </div>

          {/* Enrollment Card */}
          <div className="rounded-md border border-[#333] bg-[#141414] p-6 space-y-5 ">
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full aspect-video object-cover rounded-md border border-zinc-800"
              />
            )}

            <div className="space-y-1">
              <span className="text-sm text-zinc-400   font-semibold">
                Access
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-white">Free</span>
                <span className="text-sm text-[var(--color-primary)] font-semibold bg-[var(--color-primary)]/10 px-2 py-0.5 rounded border border-[var(--color-primary)]/30">
                  Includes Certificate
                </span>
              </div>
            </div>

            {enrollment ? (
              <div className="space-y-3">
                <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm text-center font-semibold">
                  You are enrolled in this course
                </div>
                <button
                  onClick={() => onStartLearning(enrollment.id)}
                  className="w-full py-3.5 rounded-md bg-[var(--color-primary)] hover:bg-[#e0d500] text-black font-semibold text-sm transition  flex items-center justify-center gap-2"
                >
                  <span>Continue Learning</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full py-3.5 rounded-md bg-[var(--color-primary)] hover:bg-[#e0d500] text-black font-semibold text-sm transition  disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {enrolling ? (
                  "Enrolling..."
                ) : (
                  <>
                    <span>Enroll Now for Free</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            )}

            <ul className="text-sm text-zinc-400 space-y-2 pt-2 border-t border-zinc-800">
              <li className="flex items-center gap-2">
                <Check size={16} aria-hidden="true" /> Access to all course
                lessons
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} aria-hidden="true" /> Access on mobile &
                desktop
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} aria-hidden="true" /> Verifiable Certificate of
                Completion
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
            <h2 className="text-xl font-bold text-white tracking-tight">
              Course Curriculum
            </h2>
            <span className="text-sm text-zinc-400">
              {allSessions.length} Lessons ({formatDuration(totalDuration)})
            </span>
          </div>

          <div className="space-y-4">
            {course.course.sections.map((section, secIdx) => (
              <div
                key={section.id}
                className="rounded-md border border-[var(--color-surface-elevated-alt)] bg-[var(--color-surface)] overflow-hidden"
              >
                <div className="p-4 sm:p-5 bg-zinc-900/60 border-b border-[var(--color-surface-elevated-alt)] flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-[var(--color-primary)]  ">
                      Section {secIdx + 1}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {section.title}
                    </h3>
                    {section.description && (
                      <p className="text-sm text-zinc-400">
                        {section.description}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-[var(--color-text-secondary)] font-medium">
                    {section.sessions.length}{" "}
                    {section.sessions.length === 1 ? "lesson" : "lessons"}
                  </span>
                </div>

                <div className="divide-y divide-[var(--color-surface-elevated-alt)]">
                  {section.sessions.map((session, sessIdx) => (
                    <div
                      key={session.id}
                      className="p-4 sm:px-5 flex items-center justify-between hover:bg-zinc-800/30 transition text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-mono text-sm">
                          {sessIdx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-200">
                            {session.title}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mt-0.5">
                            <span>{session.status}</span>
                            {session.video?.duration ? (
                              <>
                                <span>·</span>
                                <span>
                                  {formatDuration(session.video.duration)}
                                </span>
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
                            className="px-3 py-1 rounded-full bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30 font-bold text-sm transition"
                          >
                            <Play
                              size={16}
                              className="inline mr-1"
                              aria-hidden="true"
                            />
                            Preview
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
          <h2 className="text-xl font-bold text-white tracking-tight">
            Your Instructor
          </h2>
          <div className="pt-2 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-md bg-[var(--color-primary)] text-black font-semibold text-xl flex items-center justify-center ">
                {course.course.author?.firstName?.charAt(0) || "I"}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {course.course.author?.firstName}{" "}
                  {course.course.author?.lastName || ""}
                </h3>
                <p className="text-sm text-[var(--color-primary)] font-medium">
                  Instructor
                </p>
              </div>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed">
              {course.course.author?.bio || "No instructor biography provided."}
            </p>
          </div>
        </div>
      </div>

      {/* Free Preview Modal */}
      {previewModal && (
        <LearningDialog
          title={previewModal.title}
          onClose={() => setPreviewModal(null)}
        >
          <div className="relative w-full max-w-3xl bg-[#141414] border border-[#333] rounded-md p-6  space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-sm  font-bold text-[var(--color-primary)] ">
                  FREE PREVIEW LESSON
                </span>
                <h3 className="text-lg font-bold text-white">
                  {previewModal.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModal(null)}
                aria-label="Close lesson preview"
                className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Video Player */}
            {previewModal.video?.vimeoVideoId ? (
              <div className="aspect-video w-full rounded-md overflow-hidden bg-black border border-zinc-800">
                <iframe
                  className="w-full h-full"
                  src={`https://player.vimeo.com/video/${previewModal.video.vimeoVideoId}?autoplay=1`}
                  title={previewModal.title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="p-8 text-center bg-zinc-900 rounded-md text-zinc-400 text-sm">
                No video attached to this preview.
              </div>
            )}

            {/* Resources list */}
            {previewModal.resources && previewModal.resources.length > 0 && (
              <div className="pt-2 border-t border-zinc-800">
                <p className="text-sm font-semibold text-zinc-300 mb-2">
                  Lesson Resources:
                </p>
                <div className="flex flex-wrap gap-2">
                  {previewModal.resources.map((res) => (
                    <a
                      key={res.id}
                      href={res.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-200 border border-zinc-700 flex items-center gap-1.5"
                    >
                      <FileText size={16} aria-hidden="true" />
                      <span>{res.title}</span>
                      <span className="text-sm text-[var(--color-text-secondary)] ">
                        ({res.type})
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </LearningDialog>
      )}
    </div>
  );
};
