import type { ReactNode } from 'react';
import { useRef } from 'react';

export interface CompareTab<Id extends string> {
  id: Id;
  label: string;
  disabled?: boolean;
}

interface CompareTabsProps<Id extends string> {
  tabs: ReadonlyArray<CompareTab<Id>>;
  activeTab: Id;
  onChange: (id: Id) => void;
  children: ReactNode; // the active tab's panel content
}

export function CompareTabs<Id extends string>({
  tabs,
  activeTab,
  onChange,
  children,
}: CompareTabsProps<Id>) {
  const listRef = useRef<HTMLDivElement | null>(null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const enabled = tabs.filter((t) => !t.disabled);
    const idx = enabled.findIndex((t) => t.id === activeTab);
    if (idx === -1) return;
    const nextIdx =
      e.key === 'ArrowRight'
        ? (idx + 1) % enabled.length
        : (idx - 1 + enabled.length) % enabled.length;
    onChange(enabled[nextIdx].id);
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>(
      'button[role="tab"]',
    );
    buttons?.[tabs.indexOf(enabled[nextIdx])]?.focus();
  };

  return (
    <>
      <div
        ref={listRef}
        role="tablist"
        aria-label="比較レポートのセクション"
        className="max-w-[1040px] mx-auto px-6 mt-10 border-b border-rule flex gap-1 overflow-x-auto"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              id={`compare-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-disabled={tab.disabled || undefined}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={onKeyDown}
              onClick={() => !tab.disabled && onChange(tab.id)}
              className={`text-label-md px-4 py-3 border-b-2 whitespace-nowrap transition-colors duration-normal ${
                isActive
                  ? 'border-ink text-ink'
                  : tab.disabled
                  ? 'border-transparent text-ink-30 cursor-not-allowed'
                  : 'border-transparent text-ink-60 hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <section
        role="tabpanel"
        aria-labelledby={`compare-tab-${activeTab}`}
        className="max-w-[1040px] mx-auto px-6 mt-8"
      >
        {children}
      </section>
    </>
  );
}
