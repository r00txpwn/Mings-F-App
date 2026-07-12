import { useLanguage } from '../../contexts/LanguageContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import { hubForScreen, navItemForScreen, type CockpitScreen } from './cockpitNav';

interface CockpitHubTabsProps {
  currentScreen: CockpitScreen;
  onNavigate: (screen: CockpitScreen) => void;
}

export function CockpitHubTabs({ currentScreen, onNavigate }: CockpitHubTabsProps) {
  const { t } = useLanguage();
  const hub = hubForScreen(currentScreen);
  if (!hub || hub.members.length <= 1) return null;

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <Tabs value={currentScreen} onValueChange={(v) => onNavigate(v as CockpitScreen)}>
        <TabsList variant="line" className="h-auto w-full justify-start overflow-x-auto rounded-none border-0 bg-transparent p-0">
          {hub.members.map((memberId) => {
            const navItem = navItemForScreen(memberId);
            if (!navItem) return null;
            return (
              <TabsTrigger key={memberId} value={memberId} className="shrink-0 rounded-lg px-3 py-2">
                {t[navItem.labelKey]}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
