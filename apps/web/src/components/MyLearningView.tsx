import { BookOpen, Award } from "@virtua-lms/ui";
import {
  PageHeading,
  LoadingState,
  EmptyState,
  ErrorState,
} from "./LearningUI";
import React, { useState, useEffect, useCallback } from "react";
import { enrollmentsService } from "../services/enrollments.service";
import type { EnrollmentRecord } from "../services/enrollments.service";
import { learningService } from "../services/learning.service";
import type { LearningProgressResponse } from "../services/learning.service";
import { CertificateModal } from "./CertificateModal";

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
  const [activeSubTab, setActiveSubTab] = useState<
    "in-progress" | "completed" | "certificates"
  >("in-progress");
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
      setError(err?.message || "Failed to load your learning enrollments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const inProgressCourses = items.filter(
    (item) => (item.progress?.percentComplete || 0) < 100,
  );
  const completedCourses = items.filter(
    (item) => (item.progress?.percentComplete || 0) === 100,
  );
  const certificatesList = items.filter(
    (item) => !!item.progress?.certificate || !!item.enrollment.certificate,
  );

  const visibleCourses =
    activeSubTab === "completed" ? completedCourses : inProgressCourses;
  return (
    <section className="learning-page">
      <PageHeading
        title="My Learning"
        description="Continue your courses and access your completion credentials."
      />
      <nav className="learning-tabs" aria-label="Learning status">
        {(
          [
            {
              id: "in-progress",
              label: "In progress",
              count: inProgressCourses.length,
            },
            {
              id: "completed",
              label: "Completed",
              count: completedCourses.length,
            },
            {
              id: "certificates",
              label: "Certificates",
              count: certificatesList.length,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            aria-pressed={activeSubTab === tab.id}
            className={activeSubTab === tab.id ? "active" : ""}
            onClick={() => setActiveSubTab(tab.id)}
          >
            {tab.label}
            {!loading && <span>{tab.count}</span>}
          </button>
        ))}
      </nav>
      {loading ? (
        <LoadingState label="Loading your learning" />
      ) : error ? (
        <ErrorState message={error} retry={fetchEnrollments} />
      ) : activeSubTab === "certificates" ? (
        <div className="enrollment-list">
          {!certificatesList.length ? (
            <EmptyState
              title="No certificates yet"
              description="Complete a course and claim your certificate to see it here."
            />
          ) : (
            certificatesList.map(({ enrollment, progress }) => {
              const cert = progress?.certificate || enrollment.certificate!;
              return (
                <article className="enrollment-row" key={enrollment.id}>
                  <Award size={24} aria-hidden="true" />
                  <div className="enrollment-content">
                    <h2>{enrollment.product?.title || "Course"}</h2>
                    <p>
                      Issued {new Date(cert.issuedAt).toLocaleDateString()} ·
                      Credential {cert.code}
                    </p>
                  </div>
                  <button
                    className="learning-button secondary"
                    onClick={() =>
                      setSelectedCert({
                        certificate: cert,
                        courseTitle: enrollment.product?.title || "Course",
                      })
                    }
                  >
                    View certificate
                  </button>
                </article>
              );
            })
          )}
        </div>
      ) : (
        <div className="enrollment-list">
          {!visibleCourses.length ? (
            <EmptyState
              title={
                activeSubTab === "completed"
                  ? "No completed courses yet"
                  : "Ready to start learning?"
              }
              description={
                activeSubTab === "completed"
                  ? "Your completed courses will appear here."
                  : "Explore the catalog and enroll in a course to begin."
              }
              action={
                <button className="learning-button" onClick={onExploreCatalog}>
                  Explore courses
                </button>
              }
            />
          ) : (
            visibleCourses.map(({ enrollment, progress }) => {
              const percent = progress?.percentComplete || 0;
              const cert = progress?.certificate || enrollment.certificate;
              return (
                <article className="enrollment-row" key={enrollment.id}>
                  <div className="enrollment-thumbnail">
                    {enrollment.product?.thumbnail ? (
                      <img src={enrollment.product.thumbnail} alt="" />
                    ) : (
                      <BookOpen size={24} aria-hidden="true" />
                    )}
                  </div>
                  <div className="enrollment-content">
                    <h2>{enrollment.product?.title || "Course"}</h2>
                    {progress ? (
                      <>
                        <div
                          className="learning-progress"
                          role="progressbar"
                          aria-label={`Progress in ${enrollment.product?.title || "course"}`}
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <span style={{ width: `${percent}%` }} />
                        </div>
                        <p>
                          {percent}% complete · {progress.completedSessions} of{" "}
                          {progress.totalSessions} lessons
                        </p>
                      </>
                    ) : (
                      <p>Progress unavailable. Open the course to continue.</p>
                    )}
                  </div>
                  <div className="enrollment-actions">
                    <button
                      className={`learning-button ${activeSubTab === "completed" ? "secondary" : ""}`}
                      onClick={() => onStartLearning(enrollment.id)}
                    >
                      {activeSubTab === "completed"
                        ? "Review course"
                        : percent > 0
                          ? "Continue learning"
                          : "Start course"}
                    </button>
                    {activeSubTab === "completed" && cert && (
                      <button
                        className="learning-link"
                        onClick={() =>
                          setSelectedCert({
                            certificate: cert,
                            courseTitle: enrollment.product?.title || "Course",
                          })
                        }
                      >
                        View certificate
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert.certificate}
          courseTitle={selectedCert.courseTitle}
          studentName={userName}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </section>
  );
};
