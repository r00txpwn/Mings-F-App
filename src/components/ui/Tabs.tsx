interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeId, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700 ${className}`.trim()}>
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={active ? 'cockpit-tab cockpit-tab-active' : 'cockpit-tab'}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
