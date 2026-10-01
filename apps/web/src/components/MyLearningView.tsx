import React, { useState, useEffect, useCallback } from 'react';
import { enrollmentsService } from '../services/enrollments.service';
import type { EnrollmentRecord } from '../services/enrollments.service';
import { learningService } from '../services/learning.service';
import type { LearningProgressResponse } from '../services/learning.service';
import { CertificateModal } from './CertificateModal';

interface MyLearningViewProps {
  onStartLearning: (enrollmentId: string) => void;
  onExploreCatalog: () => void;
  userName: string;
}

interface EnrollmentWithProgress {
  enrollment: EnrollmentRecord;
  progress?: LearningProgressResponse;
}

export const MyLearningView: React.FC<MyLearningViewProps> = ({
  onStartLearning,
  onExploreCatalog,
  userName,
}) => {
  const [items, setItems] = useState<EnrollmentWithProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'in-progress' | 'completed' | 'certificates'>('in-progress');
  const [selectedCert, setSelectedCert] = useState<{
    certificate: { id: string; code: string; issuedAt: string };
    courseTitle: string;
  } | null>(null);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await enrollmentsService.getMyEnrollments({ limit: 50 });
      const enrollments = res.enrollments || [];

      // Fetch progress for each enrollment in parallel
      const progressPromises = enrollments.map(async (en) => {
        try {
          const prog = await learningService.getEnrollmentProgress(en.id);
          return { enrollment: en, progress: prog };
        } catch {
          return { enrollment: en };
        }
      });

      const withProgress = await Promise.all(progressPromises);
      setItems(withProgress);
    } catch (err: any) {
      setError(err?.message || 'Failed to load your learning enrollments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const inProgressCourses = items.filter((item) => (item.progress?.percentComplete || 0) < 100);
  const completedCourses = items.filter((item) => (item.progress?.percentComplete || 0) === 100);
  const certificatesList = items.filter((item) => !!item.progress?.certificate || !!item.enrollment.certificate);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#272727] pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">My Learning Dashboard</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Track your progress, resume video sessions, and access completion credentials.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 bg-[#181818] p-1 rounded-full border border-[#272727]">
          <button
            onClick={() => setActiveSubTab('in-progress')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeSubTab === 'in-progress'
                ? 'bg-[#F3E700] text-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            In Progress ({inProgressCourses.length})
          </button>
          <button
            onClick={() => setActiveSubTab('completed')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeSubTab === 'completed'
                ? 'bg-[#F3E700] text-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Completed ({completedCourses.length})
          </button>
          <button
            onClick={() => setActiveSubTab('certificates')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeSubTab === 'certificates'
                ? 'bg-[#F3E700] text-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Certificates ({certificatesList.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#181818] border border-[#272727] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-300">
          <p>{error}</p>
          <button
            onClick={fetchEnrollments}
            className="mt-3 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-lg text-white"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-[#272727] bg-[#181818]/60 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F3E700]/10 border border-[#F3E700]/30 text-[#F3E700] flex items-center justify-center text-2xl font-black">
            🎓
          </div>
          <h3 className="text-xl font-bold text-white">Start Your Learning Journey</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            You haven't enrolled in any courses yet. Browse our published catalog to start learning.
          </p>
          <button
            onClick={onExploreCatalog}
            className="px-6 py-2.5 bg-[#F3E700] hover:bg-[#e0d500] text-black font-extrabold text-xs rounded-full shadow-[0_0_12px_rgba(243,231,0,0.3)] transition"
          >
            Explore Course Catalog →
          </button>
        </div>
      ) : (
        <>
          {/* IN PROGRESS TAB */}
          {activeSubTab === 'in-progress' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inProgressCourses.length === 0 ? (
                <div className="col-span-2 p-12 text-center rounded-2xl border border-[#272727] bg-[#181818]/40">
                  <p className="text-sm text-zinc-400">No active in-progress courses.</p>
                </div>
              ) : (
                inProgressCourses.map(({ enrollment, progress }) => {
                  const percent = progress?.percentComplete || 0;
                  return (
                    <div
                      key={enrollment.id}
                      className="rounded-2xl border border-[#272727] bg-[#181818] hover:border-[#444] p-5 flex flex-col justify-between space-y-5 transition shadow-lg"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F3E700]">
                              COURSE ENROLLMENT
                            </span>
                            <h3 className="text-lg font-bold text-white mt-1 leading-snug">
                              {enrollment.product?.title || 'Course'}
                            </h3>
                          </div>
                          {enrollment.product?.thumbnail && (
                            <img
                              src={enrollment.product.thumbnail}
                              alt=""
                              className="w-16 h-12 object-cover rounded-lg border border-zinc-800"
                            />
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-zinc-400">Course Progress</span>
                            <span className="text-[#F3E700]">{percent}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-[#F3E700] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(243,231,0,0.5)]"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-zinc-500">
                            {progress?.completedSessions || 0} of {progress?.totalSessions || 0} lessons completed
                          </p>
                        </div>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => onStartLearning(enrollment.id)}
                        className="w-full py-2.5 bg-[#F3E700] hover:bg-[#e0d500] text-black font-extrabold text-xs rounded-xl transition shadow-[0_0_12px_rgba(243,231,0,0.3)] flex items-center justify-center gap-2"
                      >
                        <span>{percent > 0 ? 'Resume Lesson' : 'Start Course'}</span>
                        <span>→</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* COMPLETED TAB */}
          {activeSubTab === 'completed' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedCourses.length === 0 ? (
                <div className="col-span-2 p-12 text-center rounded-2xl border border-[#272727] bg-[#181818]/40">
                  <p className="text-sm text-zinc-400">You haven't completed a course yet. Keep learning!</p>
                </div>
              ) : (
                completedCourses.map(({ enrollment, progress }) => (
                  <div
                    key={enrollment.id}
                    className="rounded-2xl border border-emerald-500/20 bg-[#181818] p-5 flex flex-col justify-between space-y-5 shadow-lg"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">
                          ✓ 100% Completed
                        </span>
                        <span className="text-xs text-zinc-500">
                          {progress?.totalSessions} Lessons Finished
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white">{enrollment.product?.title}</h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onStartLearning(enrollment.id)}
                        className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
                      >
                        Review Material
                      </button>
                      {(progress?.certificate || enrollment.certificate) && (
                        <button
                          onClick={() => {
                            const cert = progress?.certificate || enrollment.certificate;
                            if (cert) {
                              setSelectedCert({
                                certificate: cert,
                                courseTitle: enrollment.product?.title || 'Course',
                              });
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-[#F3E700] hover:bg-[#e0d500] text-black font-extrabold text-xs transition shadow-[0_0_12px_rgba(243,231,0,0.3)]"
                        >
                          Certificate 📜
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* CERTIFICATES TAB */}
          {activeSubTab === 'certificates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificatesList.length === 0 ? (
                <div className="col-span-2 p-12 text-center rounded-2xl border border-[#272727] bg-[#181818]/40">
                  <p className="text-sm text-zinc-400">Complete all sessions in a course to earn your verified certificate.</p>
                </div>
              ) : (
                certificatesList.map(({ enrollment, progress }) => {
                  const cert = progress?.certificate || enrollment.certificate;
                  if (!cert) return null;
                  return (
                    <div
                      key={cert.id}
                      className="rounded-2xl border border-[#333] bg-gradient-to-br from-[#1a1a1a] to-[#121212] p-6 space-y-4 shadow-xl"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#F3E700]">
                          OFFICIAL CREDENTIAL
                        </span>
                        <span className="font-mono text-xs text-zinc-400">{cert.code}</span>
                      </div>

                      <h3 className="text-lg font-bold text-white">{enrollment.product?.title}</h3>
                      <p className="text-xs text-zinc-400">
                        Issued on {new Date(cert.issuedAt).toLocaleDateString()}
                      </p>

                      <div className="pt-2 flex items-center gap-3">
                        <button
                          onClick={() =>
                            setSelectedCert({
                              certificate: cert,
                              courseTitle: enrollment.product?.title || 'Course',
                            })
                          }
                          className="w-full py-2.5 rounded-xl bg-[#F3E700] hover:bg-[#e0d500] text-black font-bold text-xs transition shadow-[0_0_10px_rgba(243,231,0,0.3)]"
                        >
                          View Official Certificate 📜
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert.certificate}
          courseTitle={selectedCert.courseTitle}
          studentName={userName}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
};
