'use client';

import { Button } from '@/components/ui/button';
import {
   AlertDialog,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/common/projects/date-picker';
import { notifySuccess } from '@/lib/toast';
import { teams } from '@/mock-data/teams';
import { useCyclesStore } from '@/store/cycles-store';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { CYCLE_STATUSES, cycleStatusLabel } from './cycle-utils';

interface CycleFormDialogProps {
   /** Render an uncontrolled trigger button. Omit to control via `open`. */
   trigger?: React.ReactNode;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
   /** When set, the dialog edits this cycle (create mode otherwise). */
   cycleId?: string;
}

const toDateString = (date: Date | undefined): string =>
   date && !Number.isNaN(date.getTime())
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
           date.getDate()
        ).padStart(2, '0')}`
      : '';

const addDays = (date: Date, days: number): Date => {
   const next = new Date(date);
   next.setDate(next.getDate() + days);
   return next;
};

const parseDate = (iso: string): Date => new Date(`${iso}T00:00:00`);

/**
 * Create / edit cycle dialog. In edit mode the footer also exposes a
 * destructive "Delete cycle" action behind a second confirm, with the
 * "issues return to having no cycle (not deleted)" note. All mutations go
 * through `useCyclesStore` (createCycle / updateCycle / deleteCycle).
 */
export function CycleFormDialog({ trigger, open, onOpenChange, cycleId }: CycleFormDialogProps) {
   const t = useTranslations('cycles');
   const routeTeamId = useParams<{ teamId?: string }>()?.teamId;
   const createCycle = useCyclesStore((s) => s.createCycle);
   const updateCycle = useCyclesStore((s) => s.updateCycle);
   const deleteCycle = useCyclesStore((s) => s.deleteCycle);
   const cycle = useCyclesStore((s) => s.cycles.find((c) => c.id === cycleId));

   const [internalOpen, setInternalOpen] = useState(false);
   const isControlled = open !== undefined || trigger === undefined;
   const isOpen = isControlled ? (open ?? false) : internalOpen;
   const setOpen = (next: boolean) => {
      if (onOpenChange) onOpenChange(next);
      if (!isControlled) setInternalOpen(next);
   };

   const [name, setName] = useState('');
   const [teamId, setTeamId] = useState('CORE');
   const [status, setStatus] = useState('planned');
   const [startDate, setStartDate] = useState<Date | undefined>(undefined);
   const [endDate, setEndDate] = useState<Date | undefined>(undefined);
   const [capacity, setCapacity] = useState('100');
   const [deleteConfirm, setDeleteConfirm] = useState(false);
   const [saving, setSaving] = useState(false);

   const isEdit = cycleId !== undefined;

   const handleOpenChange = (next: boolean) => {
      setOpen(next);
      if (!next) return;
      if (isEdit && cycle) {
         setName(cycle.name);
         setTeamId(cycle.teamId);
         setStatus(cycle.status);
         setStartDate(parseDate(cycle.startDate));
         setEndDate(parseDate(cycle.endDate));
         setCapacity(String(cycle.capacity));
      } else {
         const today = new Date();
         setName('');
         setTeamId(routeTeamId ?? 'CORE');
         setStatus('planned');
         setStartDate(today);
         setEndDate(addDays(today, 14));
         setCapacity('100');
      }
   };

   const datesValid = startDate !== undefined && endDate !== undefined && startDate <= endDate;

   const handleSave = async () => {
      if (name.trim() === '' || !datesValid) return;
      const capacityNum = Number(capacity);
      const input = {
         name: name.trim(),
         teamId,
         status,
         startDate: toDateString(startDate),
         endDate: toDateString(endDate),
         capacity: Number.isFinite(capacityNum) ? Math.max(0, Math.round(capacityNum)) : 0,
      };
      setSaving(true);
      try {
         if (isEdit && cycleId) {
            await updateCycle(cycleId, input);
            notifySuccess(t('editDialog.updated'));
         } else {
            await createCycle(input);
            notifySuccess(t('createDialog.created'));
         }
         setOpen(false);
      } finally {
         setSaving(false);
      }
   };

   const handleDelete = async () => {
      if (!cycleId) return;
      setSaving(true);
      try {
         await deleteCycle(cycleId);
         notifySuccess(t('editDialog.deleted'));
         setOpen(false);
      } finally {
         setSaving(false);
      }
   };

   return (
      <>
         <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-md">
               <DialogHeader>
                  <DialogTitle>{t(isEdit ? 'editDialog.title' : 'createDialog.title')}</DialogTitle>
                  <DialogDescription>
                     {t(isEdit ? 'editDialog.description' : 'createDialog.description')}
                  </DialogDescription>
               </DialogHeader>

               <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                     <label className="text-sm font-medium">
                        {t('createDialog.name')}
                        <span className="text-destructive"> *</span>
                     </label>
                     <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder={t('createDialog.namePlaceholder')}
                        autoFocus
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">{t('createDialog.team')}</label>
                        <Select value={teamId} onValueChange={setTeamId}>
                           <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              {teams.map((team) => (
                                 <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">{t('createDialog.status')}</label>
                        <Select value={status} onValueChange={setStatus}>
                           <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              {CYCLE_STATUSES.map((entry) => (
                                 <SelectItem key={entry} value={entry}>
                                    {t(cycleStatusLabel[entry])}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">{t('createDialog.startDate')}</label>
                        <DatePicker date={startDate} onDateChange={setStartDate} />
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">{t('createDialog.endDate')}</label>
                        <DatePicker date={endDate} onDateChange={setEndDate} />
                     </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                     <label className="text-sm font-medium">{t('createDialog.capacity')}</label>
                     <Input
                        type="number"
                        min={0}
                        max={1000}
                        value={capacity}
                        onChange={(event) => setCapacity(event.target.value)}
                     />
                  </div>
               </div>

               <DialogFooter className="mt-2">
                  {isEdit && (
                     <Button
                        variant="destructive"
                        size="sm"
                        className="mr-auto"
                        onClick={() => setDeleteConfirm(true)}
                     >
                        {t('editDialog.delete')}
                     </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                     {t('createDialog.cancel')}
                  </Button>
                  <Button
                     size="sm"
                     onClick={() => void handleSave()}
                     disabled={name.trim() === '' || !datesValid || saving}
                  >
                     {isEdit ? t('editDialog.save') : t('createDialog.save')}
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                     {t('deleteDialog.unlink')}
                     <br />
                     {t('deleteDialog.confirmText')}
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>
                     {t('deleteDialog.cancel')}
                  </Button>
                  <Button
                     variant="destructive"
                     size="sm"
                     onClick={() => void handleDelete()}
                     disabled={saving}
                  >
                     {t('deleteDialog.confirm')}
                  </Button>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </>
   );
}
