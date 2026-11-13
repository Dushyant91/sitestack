import React from 'react';

interface CategoryNavProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  cms: 'CMS',
  framework: 'Frameworks',
  library: 'Libraries',
  analytics: 'Analytics',
  marketing: 'Marketing',
  ecommerce: 'Ecommerce',
  payment: 'Payments',
  infrastructure: 'Cloud & Hosting',
};

export const CategoryNav: React.FC<CategoryNavProps> = ({
  activeCategory,
  onSelectCategory,
  categoryCounts,
  totalCount,
}) => {
  // Get list of categories that have at least 1 detection
  const populatedCategories = Object.keys(categoryCounts).filter(
    (cat) => categoryCounts[cat] > 0
  );

  return (
    <div className="px-3 py-1 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none border-b border-white/[0.06] shrink-0">
      <button
        onClick={() => onSelectCategory('all')}
        className={`px-2.5 py-0.8 rounded-md font-medium whitespace-nowrap transition-all ${
          activeCategory === 'all'
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
            : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
      >
        All ({totalCount})
      </button>

      {populatedCategories.map((cat) => {
        const count = categoryCounts[cat];
        const label = CATEGORY_LABELS[cat] || cat;
        const isActive = activeCategory === cat;

        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-2.5 py-0.8 rounded-md font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {label} ({count})
          </button>
        );
      })}
    </div>
  );
};
