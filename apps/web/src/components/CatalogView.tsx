import { useCallback, useEffect, useState } from 'react';
import { coursesService } from '../services/courses.service';
import type { CategoryInfo, CatalogResponse } from '../services/courses.service';
import { levelColor } from '../utils/formatters';

interface CatalogViewProps {
  onSelectCourse: (courseIdOrSlug: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ onSelectCourse }) => {
  const [courses, setCourses] = useState<CatalogResponse['courses']>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState<string>('');
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
      setError(err?.message || 'Failed to load course catalog');
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
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-[#272727] bg-gradient-to-br from-[#181818] via-[#141414] to-[#0d0d0d] p-8 sm:p-12 shadow-2xl">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E700]/10 border border-[#F3E700]/30 text-[#F3E700] text-xs font-bold uppercase tracking-wider">
            <span>✨</span> Next-Gen Tech Education
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Master High-Impact <br />
            <span className="text-[#F3E700]">Engineering & Design</span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Hands-on courses, structured curricula, project resources, and verifiable completion credentials designed by top industry practitioners.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, skills, or topics..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#181818] border border-[#2e2e2e] focus:border-[#F3E700] rounded-full text-sm text-white placeholder:text-zinc-500 focus:outline-none transition"
          />
          <svg
            className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${selectedCategory === ''
              ? 'bg-[#F3E700] text-black shadow-[0_2px_10px_rgba(243,231,0,0.3)]'
              : 'bg-[#181818] text-zinc-400 hover:text-white border border-[#2a2a2a]'
              }`}
          >
            All Tracks
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${selectedCategory === cat.id
                ? 'bg-[#F3E700] text-black shadow-[0_2px_10px_rgba(243,231,0,0.3)]'
                : 'bg-[#181818] text-zinc-400 hover:text-white border border-[#2a2a2a]'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl border border-[#272727] bg-[#181818] h-80 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-300">
          <p>{error}</p>
          <button
            onClick={fetchCatalog}
            className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-lg text-white"
          >
            Retry
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-[#272727] bg-[#181818]/50 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xl">
            🔍
          </div>
          <h3 className="text-lg font-bold text-white">No courses match your filter</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Try searching for a different keyword or selecting another track.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((item) => {
            const levelStyle = levelColor(item.course?.level);
            return (
              <div
                key={item.id}
                onClick={() => onSelectCourse(item.slug || item.id)}
                className="group rounded-2xl border border-[#272727] bg-[#181818] hover:border-[#4d4d4d] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800 text-zinc-700 font-bold text-2xl">
                      {item.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {item.course?.category && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-zinc-300 border border-white/10">
                      {item.course.category.name}
                    </span>
                  )}
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#F3E700] text-black text-[10px] font-extrabold uppercase tracking-wider shadow">
                    Free Access
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                      >
                        {item.course?.level || 'ALL LEVELS'}
                      </span>
                      {item.course?._count?.sections !== undefined && (
                        <span className="text-[11px] text-zinc-500 font-medium">
                          {item.course._count.sections} {item.course._count.sections === 1 ? 'Section' : 'Sections'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-[#F3E700] transition line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {item.shortDescription || item.description || 'Comprehensive curriculum with video lessons and downloadable resources.'}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-[#272727] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 text-[#F3E700] text-xs font-bold flex items-center justify-center">
                        {item.course?.author?.firstName?.charAt(0) || 'I'}
                      </div>
                      <span className="text-xs text-zinc-400 font-medium truncate max-w-[120px]">
                        {item.course?.author ? `${item.course.author.firstName} ${item.course.author.lastName || ''}` : 'Instructor'}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-[#F3E700] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Details →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
