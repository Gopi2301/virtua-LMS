import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { learningService } from '../services/learning.service';
import type {
  LearningProgressResponse,
  PlayerSessionData,
  PlayerCurriculumSession,
} from '../services/learning.service';
import { formatDuration } from '../utils/formatters';
import { CertificateModal } from './CertificateModal';

interface CoursePlayerViewProps {
  enrollmentId: string;
  studentName: string;
  onExit: () => void;
}

export const CoursePlayerView: React.FC<CoursePlayerViewProps> = ({
  enrollmentId,
  studentName,
  onExit,
}) => {
  const [progressData, setProgressData] = useState<LearningProgressResponse | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<PlayerSessionData | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(true);
  const [loadingCourse, setLoadingCourse] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'quiz'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [updatingProgress, setUpdatingProgress] = useState<boolean>(false);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[]>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number } | null>(null);

  // Certificate celebration modal
  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [claimedCert, setClaimedCert] = useState<{ id: string; code: string; issuedAt: string } | null>(null);

  // 1. Load initial course progress & find first/next session
  const loadProgress = useCallback(async (selectSessionId?: string) => {
    try {
      const data = await learningService.getEnrollmentProgress(enrollmentId);
      setProgressData(data);
      if (data.certificate) {
        setClaimedCert(data.certificate);
      }

      if (selectSessionId) {
        setCurrentSessionId(selectSessionId);
      } else if (!currentSessionId) {
        // Resume at nextSessionId or first session
        const nextId = data.nextSessionId || data.sections[0]?.sessions[0]?.id;
        if (nextId) setCurrentSessionId(nextId);
      }
    } catch (err) {
      console.error('Failed to load course progress', err);
    } finally {
      setLoadingCourse(false);
    }
  }, [enrollmentId, currentSessionId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // 2. Load current session details whenever currentSessionId changes
  useEffect(() => {
    if (!currentSessionId) return;

    let isMounted = true;
    async function fetchSession() {
      setLoadingSession(true);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
      try {
        const sess = await learningService.getEnrollmentSession(enrollmentId, currentSessionId!);
        if (isMounted) {
          setSessionData(sess);
          if (sess.questionnaire && sess.questionnaire.questions.length > 0) {
            setActiveTab('overview');
          }
        }
      } catch (err) {
        console.error('Failed to load session details', err);
      } finally {
        if (isMounted) setLoadingSession(false);
      }
    }

    fetchSession();
    return () => {
      isMounted = false;
    };
  }, [enrollmentId, currentSessionId]);

  // Flat array of all sessions in curriculum order
  const allSessions: PlayerCurriculumSession[] = useMemo(() => {
    if (!progressData) return [];
    return progressData.sections.flatMap((s) => s.sessions);
  }, [progressData]);

  const currentIndex = allSessions.findIndex((s) => s.id === currentSessionId);
  const prevSession = currentIndex > 0 ? allSessions[currentIndex - 1] : null;
  const nextSession = currentIndex >= 0 && currentIndex < allSessions.length - 1 ? allSessions[currentIndex + 1] : null;

  // Mark session complete
  const handleMarkComplete = async (andAdvance: boolean = true) => {
    if (!currentSessionId || !progressData) return;
    setUpdatingProgress(true);
    try {
      await learningService.updateProgress(enrollmentId, {
        sessionId: currentSessionId,
        completed: true,
      });

      // Reload progress to update checkmarks
      await loadProgress(andAdvance && nextSession ? nextSession.id : currentSessionId);
    } catch (err) {
      console.error('Failed to update progress', err);
    } finally {
      setUpdatingProgress(false);
    }
  };

  // Claim certificate
  const handleClaimCertificate = async () => {
    try {
      const cert = await learningService.claimCertificate(enrollmentId);
      setClaimedCert(cert);
      setShowCertModal(true);
      await loadProgress();
    } catch (err: any) {
      alert(err?.message || 'Failed to issue certificate');
    }
  };

  // Handle quiz option selection
  const handleSelectQuizOption = (questionId: string, optionId: string, isMulti: boolean) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => {
      const current = prev[questionId] || [];
      if (isMulti) {
        const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
        return { ...prev, [questionId]: next };
      }
      return { ...prev, [questionId]: [optionId] };
    });
  };

  // Submit quiz answers
  const handleSubmitQuiz = async () => {
    if (!sessionData?.questionnaire) return;
    const questions = sessionData.questionnaire.questions;
    let correctCount = 0;

    questions.forEach((q) => {
      const userSelected = quizAnswers[q.id] || [];
      const correctOptionIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      const isCorrect =
        userSelected.length === correctOptionIds.length &&
        userSelected.every((id) => correctOptionIds.includes(id));
      if (isCorrect) correctCount++;
    });

    setQuizScore({ correct: correctCount, total: questions.length });
    setQuizSubmitted(true);

    // If passed (>70%), mark session complete!
    if (correctCount / questions.length >= 0.7) {
      await handleMarkComplete(false);
    }
  };

  if (loadingCourse) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#F3E700] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-mono tracking-wider">LOADING COURSE LEARNING ROOM...</p>
        </div>
      </div>
    );
  }

  const is100Percent = (progressData?.percentComplete || 0) === 100;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 px-4 sm:px-6 bg-[#141414] border-b border-[#252525] flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <span>←</span>
            <span className="hidden sm:inline">My Courses</span>
          </button>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="truncate max-w-xs sm:max-w-md">
            <h1 className="text-xs sm:text-sm font-bold text-white truncate">
              {progressData?.productTitle || 'Course'}
            </h1>
            <p className="text-[11px] text-[#F3E700] truncate">
              {sessionData?.title || 'Loading session...'}
            </p>
          </div>
        </div>

        {/* Right side: Progress indicator & Sidebar toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-white">
                {progressData?.completedSessions || 0} / {progressData?.totalSessions || 0} Lessons
              </span>
              <span className="text-[10px] text-[#F3E700] ml-1 font-semibold">
                ({progressData?.percentComplete || 0}%)
              </span>
            </div>
            <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F3E700] rounded-full transition-all duration-300"
                style={{ width: `${progressData?.percentComplete || 0}%` }}
              />
            </div>
          </div>

          {is100Percent && (
            <button
              onClick={() => {
                if (claimedCert) {
                  setShowCertModal(true);
                } else {
                  handleClaimCertificate();
                }
              }}
              className="px-3 py-1.5 bg-[#F3E700] hover:bg-[#e0d500] text-black text-xs font-extrabold rounded-lg shadow-[0_0_10px_rgba(243,231,0,0.4)] transition"
            >
              Claim Certificate 📜
            </button>
          )}

          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            title="Toggle Curriculum Sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Course Completion Banner */}
      {is100Percent && !claimedCert && (
        <div className="bg-gradient-to-r from-emerald-500/20 via-[#F3E700]/20 to-emerald-500/20 border-b border-[#F3E700]/30 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white">
            <span>🎉</span>
            <strong className="font-bold text-[#F3E700]">Congratulations!</strong>
            <span>You have completed all curriculum sessions. Your certificate is ready!</span>
          </div>
          <button
            onClick={handleClaimCertificate}
            className="px-3 py-1 bg-[#F3E700] text-black font-extrabold text-xs rounded-md shadow"
          >
            Claim Certificate Now
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          {loadingSession ? (
            <div className="aspect-video w-full max-w-4xl mx-auto rounded-2xl bg-[#141414] border border-[#272727] animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#F3E700] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessionData ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Media Player Container */}
              <div className="rounded-2xl overflow-hidden border border-[#272727] bg-black shadow-2xl">
                {sessionData.status === 'VIDEO' ? (
                  sessionData.video?.vimeoVideoId ? (
                    <div className="relative aspect-video w-full">
                      <iframe
                        key={sessionData.video.vimeoVideoId}
                        src={`https://player.vimeo.com/video/${sessionData.video.vimeoVideoId}?badge=0&autopause=0&player_id=0&app_id=58479`}
                        className="w-full h-full"
                        title={sessionData.title}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full flex flex-col items-center justify-center text-zinc-500 space-y-2 p-8 text-center bg-zinc-950">
                      <span className="text-3xl">🎬</span>
                      <p className="text-sm font-semibold text-zinc-300">Video Content Processing</p>
                      <p className="text-xs max-w-sm">
                        This session is designated as video learning. Please check lesson notes below.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="p-8 sm:p-12 space-y-4 bg-gradient-to-b from-[#141414] to-[#101010]">
                    <span className="px-2.5 py-1 rounded bg-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Reading Material
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">{sessionData.title}</h2>
                    <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                      {sessionData.description || 'No reading notes provided for this session.'}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#141414] border border-[#272727]">
                <button
                  onClick={() => prevSession && setCurrentSessionId(prevSession.id)}
                  disabled={!prevSession}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  ← Previous Lesson
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleMarkComplete(false)}
                    disabled={updatingProgress}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                      sessionData.completed
                        ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                        : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {sessionData.completed ? '✓ Completed' : 'Mark as Completed'}
                  </button>

                  <button
                    onClick={() => handleMarkComplete(true)}
                    disabled={updatingProgress}
                    className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#F3E700] hover:bg-[#e0d500] text-black shadow-[0_0_12px_rgba(243,231,0,0.3)] transition flex items-center gap-1.5"
                  >
                    <span>{nextSession ? 'Complete & Next' : 'Finish Course'}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* Tabs: Overview, Resources, Questionnaire */}
              <div className="rounded-2xl border border-[#272727] bg-[#141414] overflow-hidden">
                <div className="flex items-center border-b border-[#272727] px-6">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                      activeTab === 'overview'
                        ? 'border-[#F3E700] text-[#F3E700]'
                        : 'border-transparent text-zinc-400 hover:text-white'
                    }`}
                  >
                    Overview
                  </button>

                  <button
                    onClick={() => setActiveTab('resources')}
                    className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
                      activeTab === 'resources'
                        ? 'border-[#F3E700] text-[#F3E700]'
                        : 'border-transparent text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>Resources</span>
                    {sessionData.resources.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300">
                        {sessionData.resources.length}
                      </span>
                    )}
                  </button>

                  {sessionData.questionnaire && (
                    <button
                      onClick={() => setActiveTab('quiz')}
                      className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
                        activeTab === 'quiz'
                          ? 'border-[#F3E700] text-[#F3E700]'
                          : 'border-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>Quiz</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-[#F3E700]/20 text-[10px] text-[#F3E700]">
                        {sessionData.questionnaire.questions.length}
                      </span>
                    </button>
                  )}
                </div>

                <div className="p-6">
                  {/* TAB: OVERVIEW */}
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">{sessionData.title}</h3>
                        {sessionData.video?.duration ? (
                          <span className="text-xs text-zinc-400">
                            Duration: {formatDuration(sessionData.video.duration)}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                        {sessionData.description || 'No specific lesson notes provided.'}
                      </p>
                    </div>
                  )}

                  {/* TAB: RESOURCES */}
                  {activeTab === 'resources' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Downloadable Materials & Links
                      </h3>
                      {sessionData.resources.length === 0 ? (
                        <p className="text-xs text-zinc-500">No external resources attached to this session.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {sessionData.resources.map((res) => (
                            <a
                              key={res.id}
                              href={res.url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-between transition group"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">
                                  {res.type === 'PDF' ? '📄' : res.type === 'ZIP' ? '📦' : res.type === 'GITHUB' ? '🐙' : '🔗'}
                                </span>
                                <div>
                                  <p className="text-xs font-semibold text-white group-hover:text-[#F3E700] transition">
                                    {res.title}
                                  </p>
                                  <p className="text-[10px] text-zinc-500 uppercase">{res.type}</p>
                                </div>
                              </div>
                              <span className="text-xs text-zinc-500 group-hover:text-white transition">↗</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: QUIZ */}
                  {activeTab === 'quiz' && sessionData.questionnaire && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-white">{sessionData.questionnaire.title}</h3>
                          <p className="text-xs text-zinc-400">
                            Answer the questions below to test your understanding.
                          </p>
                        </div>
                        {quizScore && (
                          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                            Score: {quizScore.correct} / {quizScore.total} (
                            {Math.round((quizScore.correct / quizScore.total) * 100)}%)
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        {sessionData.questionnaire.questions.map((q, qIdx) => {
                          const isMulti = q.type === 'MULTIPLE_SELECT';
                          const selected = quizAnswers[q.id] || [];
                          return (
                            <div key={q.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                              <p className="text-xs font-bold text-white">
                                {qIdx + 1}. {q.text}{' '}
                                {isMulti && <span className="text-zinc-500 font-normal">(Select all that apply)</span>}
                              </p>

                              <div className="space-y-2">
                                {q.options.map((opt) => {
                                  const isSelected = selected.includes(opt.id);
                                  let optionStyle = 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700';

                                  if (quizSubmitted) {
                                    if (opt.isCorrect) {
                                      optionStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold';
                                    } else if (isSelected && !opt.isCorrect) {
                                      optionStyle = 'border-rose-500 bg-rose-500/10 text-rose-300 line-through';
                                    }
                                  } else if (isSelected) {
                                    optionStyle = 'border-[#F3E700] bg-[#F3E700]/10 text-white font-semibold';
                                  }

                                  return (
                                    <div
                                      key={opt.id}
                                      onClick={() => handleSelectQuizOption(q.id, opt.id, isMulti)}
                                      className={`p-3 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${optionStyle}`}
                                    >
                                      <span>{opt.text}</span>
                                      {quizSubmitted && opt.isCorrect && (
                                        <span className="text-emerald-400 font-bold">✓ Correct</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {!quizSubmitted ? (
                          <button
                            onClick={handleSubmitQuiz}
                            className="px-6 py-2.5 bg-[#F3E700] hover:bg-[#e0d500] text-black font-extrabold text-xs rounded-xl shadow-[0_0_12px_rgba(243,231,0,0.3)] transition"
                          >
                            Submit Answers
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setQuizSubmitted(false);
                              setQuizAnswers({});
                              setQuizScore(null);
                            }}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition"
                          >
                            Retake Quiz
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-zinc-400">Select a lesson from the curriculum sidebar.</div>
          )}
        </main>

        {/* Collapsible Curriculum Sidebar */}
        {sidebarOpen && (
          <aside className="w-80 sm:w-96 border-l border-[#252525] bg-[#141414] overflow-y-auto flex flex-col justify-between shrink-0">
            <div className="p-4 border-b border-[#252525] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Curriculum Syllabus</h3>
              <span className="text-xs font-mono text-[#F3E700] font-bold">
                {progressData?.percentComplete || 0}% Complete
              </span>
            </div>

            <div className="flex-1 divide-y divide-[#202020] overflow-y-auto">
              {progressData?.sections.map((section, secIdx) => (
                <div key={section.id} className="py-2">
                  <div className="px-4 py-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Section {secIdx + 1}: {section.title}
                  </div>

                  <div className="space-y-0.5 px-2">
                    {section.sessions.map((sess) => {
                      const isActive = sess.id === currentSessionId;
                      return (
                        <div
                          key={sess.id}
                          onClick={() => setCurrentSessionId(sess.id)}
                          className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs transition ${
                            isActive
                              ? 'bg-[#F3E700]/10 border border-[#F3E700]/40 text-white font-bold'
                              : 'hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                sess.completed
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-zinc-800 text-zinc-500'
                              }`}
                            >
                              {sess.completed ? '✓' : '○'}
                            </span>
                            <span className="truncate">{sess.title}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono shrink-0 ml-2">
                            {sess.status === 'VIDEO' && sess.video?.duration ? (
                              <span>{formatDuration(sess.video.duration)}</span>
                            ) : (
                              <span>{sess.status}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Certificate Modal */}
      {showCertModal && claimedCert && (
        <CertificateModal
          certificate={claimedCert}
          courseTitle={progressData?.productTitle || 'Course'}
          studentName={studentName}
          onClose={() => setShowCertModal(false)}
        />
      )}
    </div>
  );
};
