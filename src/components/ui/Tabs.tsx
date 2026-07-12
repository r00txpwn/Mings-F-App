import {
  Tabs as ShadTabs,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import { cn } from '@/lib/utils';

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
    <ShadTabs value={activeId} onValueChange={onChange} className={cn(className)}>
      <TabsList variant="line" className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex-none rounded-none px-4 py-3"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </ShadTabs>
  );
}
