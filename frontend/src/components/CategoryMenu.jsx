import { useState } from 'react';

const CATEGORIES = [
  { value: null, label: 'All' },
  { value: 'science', label: 'Science' },
  { value: 'tech', label: 'Tech & Coding' },
  { value: 'business', label: 'Business & Money' },
  { value: 'math', label: 'Math' },
  { value: 'history', label: 'History & Culture' },
  { value: 'mind', label: 'Philosophy & Mind' },
  { value: 'health', label: 'Health & Biology' },
  { value: 'language', label: 'Language & Linguistics' },
];

export default function CategoryMenu({ selectedCategory, onSelectCategory }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = CATEGORIES.find((c) => c.value === selectedCategory)?.label || 'All';

  function handleSelect(value) {
    onSelectCategory(value);
    setIsOpen(false);
  }

  return (
    <>
      {/* Floating button - top right */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-30 px-4 py-2 bg-white/10 backdrop-blur-md text-white text-sm font-medium rounded-full border border-white/20 hover:bg-white/20 transition"
      >
        {selectedLabel}
      </button>

      {/* Menu overlay */}
      {isOpen && (
        <>
          {/* Dark backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu panel */}
          <div className="fixed inset-x-0 bottom-0 z-50 bg-neutral-900 rounded-t-3xl p-6 pb-8 animate-slide-up">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

            <h2 className="text-white text-lg font-semibold mb-4">Choose a category</h2>

            <div className="flex flex-col gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.value ?? 'all'}
                  onClick={() => handleSelect(category.value)}
                  className={`text-left px-4 py-3 rounded-xl text-base font-medium transition ${
                    selectedCategory === category.value
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}