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
import { DatePicker } from './date-picker';
import { notifySuccess } from '@/lib/toast';
import { health } from '@/mock-data/projects';
import { priorities } from '@/mock-data/priorities';
import { teams } from '@/mock-data/teams';
import { users } from '@/mock-data/users';
import { useProjectsStore } from '@/store/projects-store';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface ProjectFormDialogProps {
   /** Render an uncontrolled trigger button. Omit to control via `open`. */
   trigger?: React.ReactNode;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
   /** When set, the dialog edits this project (create mode otherwise). */
   projectId?: string;
}

const isoDate = (date: Date | undefined): string | null =>
   date ? date.toISOString().slice(0, 10) : null;

/**
 * Create / edit project dialog. In edit mode the footer also exposes a
 * destructive "Delete project" action behind a second confirm, with the
 * "issues are unlinked (not deleted)" note. All mutations go through
 * `useProjectsStore` (createProject / updateProject / deleteProject).
 */
export function ProjectFormDialog({
   trigger,
   open,
   onOpenChange,
   projectId,
}: ProjectFormDialogProps) {
   const t = useTranslations('projects');
   const createProject = useProjectsStore((s) => s.createProject);
   const updateProject = useProjectsStore((s) => s.updateProject);
   const deleteProject = useProjectsStore((s) => s.deleteProject);
   const project = useProjectsStore((s) => s.projects.find((p) => p.id === projectId));

   const [internalOpen, setInternalOpen] = useState(false);
   const isControlled = open !== undefined || trigger === undefined;
   const isOpen = isControlled ? (open ?? false) : internalOpen;
   const setOpen = (next: boolean) => {
      if (onOpenChange) onOpenChange(next);
      if (!isControlled) setInternalOpen(next);
   };

   const [name, setName] = useState('');
   const [teamId, setTeamId] = useState('CORE');
   const [selectedHealth, setSelectedHealth] = useState('no-update');
   const [priority, setPriority] = useState('no-priority');
   const [leadId, setLeadId] = useState('__none__');
   const [startDate, setStartDate] = useState<Date | undefined>(undefined);
   const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
   const [deleteConfirm, setDeleteConfirm] = useState(false);
   const [saving, setSaving] = useState(false);

   const isEdit = projectId !== undefined;

   const handleOpenChange = (next: boolean) => {
      setOpen(next);
      if (!next) return;
      if (isEdit && project) {
         setName(project.name);
         setTeamId(project.teamId);
         setSelectedHealth(project.health ?? 'no-update');
         setPriority(project.priority ?? 'no-priority');
         setLeadId(project.leadId ?? '__none__');
         setStartDate(project.startDate ? new Date(`${project.startDate}T00:00:00`) : undefined);
         setTargetDate(project.targetDate ? new Date(`${project.targetDate}T00:00:00`) : undefined);
      } else {
         setName('');
         setTeamId('CORE');
         setSelectedHealth('no-update');
         setPriority('no-priority');
         setLeadId('__none__');
         setStartDate(undefined);
         setTargetDate(undefined);
      }
   };

   const handleSave = async () => {
      if (name.trim() === '') return;
      const input = {
         name: name.trim(),
         teamId,
         health: selectedHealth,
         priority,
         leadId: leadId === '__none__' ? null : leadId,
         startDate: isoDate(startDate),
         targetDate: isoDate(targetDate),
      };
      setSaving(true);
      try {
         if (isEdit && projectId) {
            await updateProject(projectId, input);
            notifySuccess(t('editDialog.updated'));
         } else {
            await createProject(input);
            notifySuccess(t('createDialog.created'));
         }
         setOpen(false);
      } finally {
         setSaving(false);
      }
   };

   const handleDelete = async () => {
      if (!projectId) return;
      setSaving(true);
      try {
         await deleteProject(projectId);
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

                  <div className="grid grid-cols-2 gap-3">
                     <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">{t('createDialog.health')}</label>
                        <Select value={selectedHealth} onValueChange={setSelectedHealth}>
                           <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              {health.map((entry) => (
                                 <SelectItem key={entry.id} value={entry.id}>
                                    <span className="flex items-center gap-1.5">
                                       <span
                                          className="size-2 rounded-full"
                                          style={{ backgroundColor: entry.color }}
                                       />
                                       {entry.name}
                                    </span>
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">{t('createDialog.priority')}</label>
                        <Select value={priority} onValueChange={setPriority}>
                           <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              {priorities.map((item) => (
                                 <SelectItem key={item.id} value={item.id}>
                                    <span className="flex items-center gap-1.5">
                                       <item.icon className="size-3.5" />
                                       {item.name}
                                    </span>
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                     <label className="text-sm font-medium">{t('createDialog.lead')}</label>
                     <Select value={leadId} onValueChange={setLeadId}>
                        <SelectTrigger className="h-8 text-xs">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="__none__">{t('createDialog.noLead')}</SelectItem>
                           {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                 {user.name}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">{t('createDialog.startDate')}</label>
                        <DatePicker date={startDate} onDateChange={setStartDate} />
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">
                           {t('createDialog.targetDate')}
                        </label>
                        <DatePicker date={targetDate} onDateChange={setTargetDate} />
                     </div>
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
                     disabled={name.trim() === '' || saving}
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
