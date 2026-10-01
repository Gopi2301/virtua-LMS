import { useCallback, useEffect, useState } from "react";
import { coursesService } from "../services/courses.service";
import type {
  CategoryInfo,
  CatalogResponse,
} from "../services/courses.service";
import { BookOpen, Search } from "@virtua-lms/ui";
import {
  PageHeading,
  LoadingState,
  EmptyState,
  ErrorState,
} from "./LearningUI";

interface CatalogViewProps {
  onSelectCourse: (courseIdOrSlug: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ onSelectCourse }) => {
  const [courses, setCourses] = useState<CatalogResponse["courses"]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catData, catalogData] = await Promise.all([
        coursesService.getCategories().catch(() => [] as CategoryInfo[]),
        coursesService.getCatalog({
          search: search.trim() || undefined,
          categoryId: selectedCategory || undefined,
        }),
      ]);
      setCategories(catData);
      setCourses(catalogData.courses || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load course catalog");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalog();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCatalog]);

  return (
    <section className="learning-page">
      <PageHeading
        title="Explore courses"
        description="Find a subject to study and learn at your own pace."
      />
      <div className="catalog-filters">
        <label className="learning-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search courses</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, skills, or topics"
          />
        </label>
        <label className="category-select">
          <span>Category</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loading ? (
        <LoadingState label="Loading courses" />
      ) : error ? (
        <ErrorState message={error} retry={fetchCatalog} />
      ) : !courses.length ? (
        <EmptyState
          title="No courses found"
          description="Try another search or select a different category."
          action={
            <button
              className="learning-link"
              onClick={() => {
                setSearch("");
                setSelectedCategory("");
              }}
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <p className="results-label" role="status">
            {courses.length} {courses.length === 1 ? "course" : "courses"}
            {selectedCategory ? " in this category" : " available"}
          </p>
          <div className="catalog-grid">
            {courses.map((course) => (
              <button
                key={course.id}
                className="catalog-course"
                onClick={() => onSelectCourse(course.slug || course.id)}
              >
                <span className="catalog-thumbnail">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt="" loading="lazy" />
                  ) : (
                    <BookOpen size={28} aria-hidden="true" />
                  )}
                </span>
                <span className="catalog-course-body">
                  <span className="course-category">
                    {course.course.category?.name || "Course"}
                  </span>
                  <h2>{course.title}</h2>
                  <span className="course-author">
                    {[
                      course.course.author?.firstName,
                      course.course.author?.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ") || "Virtua Academy"}
                  </span>
                  {course.shortDescription && <p>{course.shortDescription}</p>}
                  <span className="course-facts">
                    {course.course.level.replaceAll("_", " ").toLowerCase()}
                    <span>·</span>
                    {course.course._count?.sections ?? 0} sections
                  </span>
                  <span className="course-access">Free access</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
};
