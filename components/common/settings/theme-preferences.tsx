'use client';

import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { DarkVariant, LightVariant, ThemeMode, useThemeStore } from '@/store/theme-store';
import { Check, ChevronDown, Pipette } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SettingsCard, SettingsRow } from './shared';

/* ------------------------------- theme list ------------------------------- */

interface ThemeOption {
   id: string;
   label: string;
   swatch: { bg: string; fg: string; accent: string };
}

const SWATCHES: Record<string, ThemeOption['swatch']> = {
   'system': { bg: '#ffffff', fg: '#18181b', accent: '#6771c5' },
   'light': { bg: '#fafafa', fg: '#18181b', accent: '#6771c5' },
   'pure-light': { bg: '#ffffff', fg: '#000000', accent: '#6771c5' },
   'dark': { bg: '#18181b', fg: '#f4f4f5', accent: '#6771c5' },
   'magic-blue': { bg: '#1c1b2e', fg: '#e4e4fb', accent: '#575bc7' },
   'classic-dark': { bg: '#191a1f', fg: '#eef0f3', accent: '#8a8f98' },
   'custom': { bg: '#1c1a2b', fg: '#eeeefc', accent: '#605e92' },
};

const LABELS: Record<string, string> = {
   'system': 'theme.system',
   'light': 'theme.light',
   'pure-light': 'theme.pureLight',
   'dark': 'theme.dark',
   'magic-blue': 'theme.magicBlue',
   'classic-dark': 'theme.classicDark',
   'custom': 'theme.custom',
};

const option = (id: string): ThemeOption => ({ id, label: LABELS[id], swatch: SWATCHES[id] });

const LIGHT_VARIANTS = ['light', 'pure-light'].map(option);
const DARK_VARIANTS = ['dark', 'magic-blue', 'classic-dark'].map(option);
const ALL_OPTIONS = [option('system'), ...LIGHT_VARIANTS, ...DARK_VARIANTS, option('custom')];

function ThemeSwatch({ swatch }: { swatch: ThemeOption['swatch'] }) {
   return (
      <span
         className="inline-flex items-center gap-1 rounded-full border border-black/10 px-1.5 py-px text-[10px] font-medium shrink-0"
         style={{ backgroundColor: swatch.bg, color: swatch.fg }}
      >
         <span className="size-1 rounded-full" style={{ backgroundColor: swatch.accent }} />
         Aa
      </span>
   );
}

function ThemeSelect({
   options,
   value,
   onChange,
}: {
   options: ThemeOption[];
   value: string;
   onChange: (id: string) => void;
}) {
   const t = useTranslations('settings');
   const current = options.find((candidate) => candidate.id === value) ?? options[0];
   return (
      <DropdownMenu>
         <DropdownMenuTrigger className="h-8 px-2.5 rounded-md border bg-container text-sm inline-flex items-center gap-1.5 hover:bg-accent transition-colors outline-none">
            <ThemeSwatch swatch={current.swatch} />
            {t(current.label)}
            <ChevronDown className="size-3.5 text-muted-foreground" />
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end" className="min-w-52">
            {options.map((candidate) => (
               <DropdownMenuItem
                  key={candidate.id}
                  onClick={() => onChange(candidate.id)}
                  className="flex items-center gap-2 text-sm"
               >
                  <ThemeSwatch swatch={candidate.swatch} />
                  <span className="flex-1">{t(candidate.label)}</span>
                  {value === candidate.id && <Check className="size-3.5" />}
               </DropdownMenuItem>
            ))}
         </DropdownMenuContent>
      </DropdownMenu>
   );
}

/* ------------------------------ custom fields ------------------------------ */

function ColorField({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
   const dark =
      parseInt(value.replace('#', '').slice(0, 2) || '00', 16) * 0.8 +
         parseInt(value.replace('#', '').slice(2, 4) || '00', 16) * 1.6 +
         parseInt(value.replace('#', '').slice(4, 6) || '00', 16) * 0.3 <
      330;
   return (
      <label
         className="relative h-8 w-44 px-3 rounded-md border inline-flex items-center gap-2 text-sm font-medium cursor-pointer"
         style={{ backgroundColor: value, color: dark ? '#ffffff' : '#17171c' }}
      >
         <Pipette className="size-3.5" />
         {value.toUpperCase()}
         <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
         />
      </label>
   );
}

function ContrastField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
   return (
      <span className="inline-flex items-center gap-3 w-56">
         <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="flex-1 accent-violet-500"
         />
         <span className="text-sm text-muted-foreground w-6 text-right">{value}</span>
      </span>
   );
}

/* --------------------------------- export --------------------------------- */

/**
 * "Interface and theme" card of the Preferences page: fully functional
 * Linear-style theme system (variants + custom theme with live CSS
 * variables, import/export via the clipboard).
 */
export function ThemePreferences() {
   const {
      mode,
      lightVariant,
      darkVariant,
      custom,
      setMode,
      setLightVariant,
      setDarkVariant,
      setCustom,
   } = useThemeStore();
   const t = useTranslations('settings');
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);

   if (!mounted) return null;

   const interfaceValue =
      mode === 'system'
         ? 'system'
         : mode === 'custom'
           ? 'custom'
           : mode === 'light'
             ? lightVariant
             : darkVariant;

   const handleInterfaceChange = (id: string) => {
      if (id === 'system') setMode('system');
      else if (id === 'custom') setMode('custom');
      else if (LIGHT_VARIANTS.some((candidate) => candidate.id === id)) {
         setLightVariant(id as LightVariant);
         setMode('light' as ThemeMode);
      } else {
         setDarkVariant(id as DarkVariant);
         setMode('dark' as ThemeMode);
      }
   };

   const copyTheme = async () => {
      try {
         await navigator.clipboard.writeText(JSON.stringify(custom, null, 2));
         toast.success(t('theme.toastCopied'));
      } catch {
         toast.error(t('theme.toastClipboardError'));
      }
   };

   const importTheme = async () => {
      try {
         const parsed = JSON.parse(await navigator.clipboard.readText());
         if (typeof parsed !== 'object' || parsed === null) throw new Error('invalid');
         setCustom(parsed);
         setMode('custom');
         toast.success(t('theme.toastImported'));
      } catch {
         toast.error(t('theme.toastImportError'));
      }
   };

   return (
      <>
         <SettingsCard>
            <SettingsRow
               title={t('theme.interfaceTheme')}
               description={t('theme.interfaceThemeDesc')}
               trailing={
                  <ThemeSelect
                     options={ALL_OPTIONS}
                     value={interfaceValue}
                     onChange={handleInterfaceChange}
                  />
               }
            />
            {mode !== 'custom' && (
               <>
                  <SettingsRow
                     title={t('theme.light')}
                     description={t('theme.lightDescription')}
                     trailing={
                        <ThemeSelect
                           options={LIGHT_VARIANTS}
                           value={lightVariant}
                           onChange={(id) => setLightVariant(id as LightVariant)}
                        />
                     }
                  />
                  <SettingsRow
                     title={t('theme.dark')}
                     description={t('theme.darkDescription')}
                     trailing={
                        <ThemeSelect
                           options={DARK_VARIANTS}
                           value={darkVariant}
                           onChange={(id) => setDarkVariant(id as DarkVariant)}
                        />
                     }
                  />
               </>
            )}
            {mode === 'custom' && (
               <>
                  <SettingsRow
                     title={t('theme.accent')}
                     trailing={
                        <ColorField
                           value={custom.accent}
                           onChange={(accent) => setCustom({ accent })}
                        />
                     }
                  />
                  <SettingsRow
                     title={t('theme.background')}
                     trailing={
                        <ColorField
                           value={custom.background}
                           onChange={(background) => setCustom({ background })}
                        />
                     }
                  />
                  <SettingsRow
                     title={t('theme.contrast')}
                     trailing={
                        <ContrastField
                           value={custom.contrast}
                           onChange={(contrast) => setCustom({ contrast })}
                        />
                     }
                  />
               </>
            )}
         </SettingsCard>

         {mode === 'custom' && (
            <>
               <SettingsCard>
                  <SettingsRow
                     title={t('theme.sidebarTheme')}
                     trailing={
                        <Switch
                           checked={custom.sidebar}
                           onCheckedChange={(sidebar: boolean) => setCustom({ sidebar })}
                        />
                     }
                  />
                  {custom.sidebar && (
                     <>
                        <SettingsRow
                           title={t('theme.accent')}
                           trailing={
                              <ColorField
                                 value={custom.sidebarAccent}
                                 onChange={(sidebarAccent) => setCustom({ sidebarAccent })}
                              />
                           }
                        />
                        <SettingsRow
                           title={t('theme.background')}
                           trailing={
                              <ColorField
                                 value={custom.sidebarBackground}
                                 onChange={(sidebarBackground) => setCustom({ sidebarBackground })}
                              />
                           }
                        />
                        <SettingsRow
                           title={t('theme.contrast')}
                           trailing={
                              <ContrastField
                                 value={custom.sidebarContrast}
                                 onChange={(sidebarContrast) => setCustom({ sidebarContrast })}
                              />
                           }
                        />
                     </>
                  )}
               </SettingsCard>
               <SettingsCard>
                  <SettingsRow
                     title={t('theme.sharing')}
                     trailing={
                        <span className="inline-flex items-center gap-4 text-sm">
                           <button
                              onClick={importTheme}
                              className="hover:text-foreground text-muted-foreground transition-colors"
                           >
                              {t('theme.import')}
                           </button>
                           <button
                              onClick={copyTheme}
                              className="hover:text-foreground text-muted-foreground transition-colors"
                           >
                              {t('theme.copy')}
                           </button>
                        </span>
                     }
                  />
               </SettingsCard>
            </>
         )}
      </>
   );
}
