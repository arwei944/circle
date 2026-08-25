'use client';

import * as React from 'react';
import { Check, Laptop, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSub,
   DropdownMenuSubContent,
   DropdownMenuSubTrigger,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DarkVariant, LightVariant, useThemeStore } from '@/store/theme-store';
import { useTranslations } from 'next-intl';

const LIGHT_VARIANTS: { id: LightVariant; label: string }[] = [
   { id: 'pure-light', label: 'theme.pureLight' },
   { id: 'light', label: 'theme.light' },
];

const DARK_VARIANTS: { id: DarkVariant; label: string }[] = [
   { id: 'dark', label: 'theme.dark' },
   { id: 'magic-blue', label: 'theme.magicBlue' },
   { id: 'classic-dark', label: 'theme.classicDark' },
];

/**
 * Sidebar theme switcher, wired to the theme store: Light and Dark open
 * submenus with their variants; System follows the OS appearance (the
 * fully custom theme is only reachable from Settings → Preferences).
 */
export function ThemeToggle() {
   const { mode, lightVariant, darkVariant, setMode, setLightVariant, setDarkVariant } =
      useThemeStore();
   const t = useTranslations('common');

   // Avoid hydration mismatches: the store is persisted in localStorage.
   const [mounted, setMounted] = React.useState(false);
   React.useEffect(() => {
      setMounted(true);
   }, []);
   if (!mounted) return null;

   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
               {mode === 'light' ? (
                  <Sun className="h-4 w-4" />
               ) : mode === 'dark' ? (
                  <Moon className="h-4 w-4" />
               ) : (
                  <Laptop className="h-4 w-4" />
               )}
               <span className="sr-only">{t('theme.toggle')}</span>
            </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuSub>
               <DropdownMenuSubTrigger>
                  <Sun className="mr-2 h-4 w-4" />
                  <span className="flex-1">{t('theme.light')}</span>
                  {mode === 'light' && <Check className="h-3.5 w-3.5" />}
               </DropdownMenuSubTrigger>
               <DropdownMenuSubContent className="w-40">
                  {LIGHT_VARIANTS.map((variant) => (
                     <DropdownMenuItem
                        key={variant.id}
                        onClick={() => {
                           setLightVariant(variant.id);
                           setMode('light');
                        }}
                     >
                        <span className="flex-1">{t(variant.label)}</span>
                        {mode === 'light' && lightVariant === variant.id && (
                           <Check className="h-3.5 w-3.5" />
                        )}
                     </DropdownMenuItem>
                  ))}
               </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
               <DropdownMenuSubTrigger>
                  <Moon className="mr-2 h-4 w-4" />
                  <span className="flex-1">{t('theme.dark')}</span>
                  {mode === 'dark' && <Check className="h-3.5 w-3.5" />}
               </DropdownMenuSubTrigger>
               <DropdownMenuSubContent className="w-40">
                  {DARK_VARIANTS.map((variant) => (
                     <DropdownMenuItem
                        key={variant.id}
                        onClick={() => {
                           setDarkVariant(variant.id);
                           setMode('dark');
                        }}
                     >
                        <span className="flex-1">{t(variant.label)}</span>
                        {mode === 'dark' && darkVariant === variant.id && (
                           <Check className="h-3.5 w-3.5" />
                        )}
                     </DropdownMenuItem>
                  ))}
               </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={() => setMode('system')}>
               <Laptop className="mr-2 h-4 w-4" />
               <span className="flex-1">{t('theme.system')}</span>
               {mode === 'system' && <Check className="h-3.5 w-3.5" />}
            </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   );
}
