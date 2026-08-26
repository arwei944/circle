'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Plus } from 'lucide-react';
import { labels as allLabels, LabelInterface } from '@/mock-data/labels';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface LabelSelectorProps {
   selected: LabelInterface[];
   onLabelsChange: (labels: LabelInterface[]) => void;
}

/** Label picker for the project properties panel ("+ adds a label" button). */
export function LabelSelector({ selected, onLabelsChange }: LabelSelectorProps) {
   const t = useTranslations('projects');
   const [open, setOpen] = useState(false);

   const toggle = (label: LabelInterface) => {
      const has = selected.some((l) => l.id === label.id);
      onLabelsChange(has ? selected.filter((l) => l.id !== label.id) : [...selected, label]);
   };

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
            <button
               type="button"
               className="text-muted-foreground hover:text-foreground transition-colors"
               aria-label={t('properties.addLabel')}
            >
               <Plus className="size-3.5" />
            </button>
         </PopoverTrigger>
         <PopoverContent className="border-input w-56 p-1.5" align="start">
            <div className="flex flex-col">
               {allLabels.map((label) => {
                  const has = selected.some((l) => l.id === label.id);
                  return (
                     <button
                        key={label.id}
                        type="button"
                        onClick={() => toggle(label)}
                        className={cn(
                           'flex items-center justify-between gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent',
                           has && 'bg-accent'
                        )}
                     >
                        <span className="flex items-center gap-1.5 min-w-0">
                           <span
                              className="size-2 rounded-full shrink-0"
                              style={{ backgroundColor: label.color }}
                           />
                           <span className="truncate">{label.name}</span>
                        </span>
                        {has && <Check className="size-3.5 shrink-0" />}
                     </button>
                  );
               })}
            </div>
         </PopoverContent>
      </Popover>
   );
}
