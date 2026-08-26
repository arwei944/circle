'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
   ContextMenuContent,
   ContextMenuGroup,
   ContextMenuItem,
   ContextMenuSeparator,
   ContextMenuShortcut,
   ContextMenuSub,
   ContextMenuSubContent,
   ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import {
   CircleCheck,
   User,
   BarChart3,
   Tag,
   Folder,
   CalendarClock,
   Pencil,
   Link as LinkIcon,
   Repeat2,
   Copy as CopyIcon,
   PlusSquare,
   Flag,
   ArrowRightLeft,
   Bell,
   Star,
   AlarmClock,
   Trash2,
   CheckCircle2,
   Clock,
   FileText,
   MessageSquare,
   Clipboard,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useIssuesStore } from '@/store/issues-store';
import { useProjectsStore } from '@/store/projects-store';
import { toProjectViewModels } from '@/components/common/projects/project-adapter';
import { toLocalDateString } from '@/lib/date-utils';
import { status } from '@/mock-data/status';
import { priorities } from '@/mock-data/priorities';
import { users } from '@/mock-data/users';
import { labels } from '@/mock-data/labels';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface IssueContextMenuProps {
   issueId?: string;
}

export function IssueContextMenu({ issueId }: IssueContextMenuProps) {
   const [isSubscribed, setIsSubscribed] = useState(false);
   const [isFavorite, setIsFavorite] = useState(false);
   const t = useTranslations('issues');
   const leanProjects = useProjectsStore((s) => s.projects);
   const projects = useMemo(() => toProjectViewModels(leanProjects), [leanProjects]);

   const {
      updateIssueStatus,
      updateIssuePriority,
      updateIssueAssignee,
      addIssueLabel,
      removeIssueLabel,
      updateIssueProject,
      updateIssue,
      getIssueById,
   } = useIssuesStore();

   const handleStatusChange = (statusId: string) => {
      if (!issueId) return;
      const newStatus = status.find((s) => s.id === statusId);
      if (newStatus) {
         updateIssueStatus(issueId, newStatus);
         toast.success(t('contextMenu.toasts.statusUpdated', { status: newStatus.name }));
      }
   };

   const handlePriorityChange = (priorityId: string) => {
      if (!issueId) return;
      const newPriority = priorities.find((p) => p.id === priorityId);
      if (newPriority) {
         updateIssuePriority(issueId, newPriority);
         toast.success(t('contextMenu.toasts.priorityUpdated', { priority: newPriority.name }));
      }
   };

   const handleAssigneeChange = (userId: string | null) => {
      if (!issueId) return;
      const newAssignee = userId ? users.find((u) => u.id === userId) || null : null;
      updateIssueAssignee(issueId, newAssignee);
      toast.success(
         newAssignee
            ? t('contextMenu.toasts.assignedTo', { name: newAssignee.name })
            : t('contextMenu.toasts.unassigned')
      );
   };

   const handleLabelToggle = (labelId: string) => {
      if (!issueId) return;
      const issue = getIssueById(issueId);
      const label = labels.find((l) => l.id === labelId);

      if (!issue || !label) return;

      const hasLabel = issue.labels.some((l) => l.id === labelId);

      if (hasLabel) {
         removeIssueLabel(issueId, labelId);
         toast.success(t('contextMenu.toasts.removedLabel', { label: label.name }));
      } else {
         addIssueLabel(issueId, label);
         toast.success(t('contextMenu.toasts.addedLabel', { label: label.name }));
      }
   };

   const handleProjectChange = (projectId: string | null) => {
      if (!issueId) return;
      const newProject = projectId ? projects.find((p) => p.id === projectId) : undefined;
      updateIssueProject(issueId, newProject);
      toast.success(
         newProject
            ? t('contextMenu.toasts.projectSetTo', { project: newProject.name })
            : t('contextMenu.toasts.projectRemoved')
      );
   };

   const handleSetDueDate = () => {
      if (!issueId) return;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      updateIssue(issueId, { dueDate: toLocalDateString(dueDate) });
      toast.success(t('contextMenu.toasts.dueDateSet'));
   };

   const handleAddLink = () => {
      toast.success(t('contextMenu.toasts.linkAdded'));
   };

   const handleMakeCopy = () => {
      toast.success(t('contextMenu.toasts.issueCopied'));
   };

   const handleCreateRelated = () => {
      toast.success(t('contextMenu.toasts.relatedCreated'));
   };

   const handleMarkAs = (type: string) => {
      toast.success(t('contextMenu.toasts.markedAs', { type }));
   };

   const handleMove = () => {
      toast.success(t('contextMenu.toasts.issueMoved'));
   };

   const handleSubscribe = () => {
      setIsSubscribed(!isSubscribed);
      toast.success(
         isSubscribed ? t('contextMenu.toasts.unsubscribed') : t('contextMenu.toasts.subscribed')
      );
   };

   const handleFavorite = () => {
      setIsFavorite(!isFavorite);
      toast.success(
         isFavorite
            ? t('contextMenu.toasts.removedFromFavorites')
            : t('contextMenu.toasts.addedToFavorites')
      );
   };

   const handleCopy = () => {
      if (!issueId) return;
      const issue = getIssueById(issueId);
      if (issue) {
         navigator.clipboard.writeText(issue.title);
         toast.success(t('contextMenu.toasts.copiedToClipboard'));
      }
   };

   const handleRemindMe = () => {
      toast.success(t('contextMenu.toasts.reminderSet'));
   };

   return (
      <ContextMenuContent className="w-64">
         <ContextMenuGroup>
            <ContextMenuSub>
               <ContextMenuSubTrigger>
                  <CircleCheck className="mr-2 size-4" /> {t('contextMenu.status')}
               </ContextMenuSubTrigger>
               <ContextMenuSubContent className="w-48">
                  {status.map((s) => {
                     const Icon = s.icon;
                     return (
                        <ContextMenuItem key={s.id} onClick={() => handleStatusChange(s.id)}>
                           <Icon /> {s.name}
                        </ContextMenuItem>
                     );
                  })}
               </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
               <ContextMenuSubTrigger>
                  <User className="mr-2 size-4" /> {t('contextMenu.assignee')}
               </ContextMenuSubTrigger>
               <ContextMenuSubContent className="w-48">
                  <ContextMenuItem onClick={() => handleAssigneeChange(null)}>
                     <User className="size-4" /> {t('contextMenu.unassigned')}
                  </ContextMenuItem>
                  {users
                     .filter((user) => user.teamIds.includes('CORE'))
                     .map((user) => (
                        <ContextMenuItem
                           key={user.id}
                           onClick={() => handleAssigneeChange(user.id)}
                        >
                           <Avatar className="size-4">
                              <AvatarImage src={user.avatarUrl} alt={user.name} />
                              <AvatarFallback>{user.name[0]}</AvatarFallback>
                           </Avatar>
                           {user.name}
                        </ContextMenuItem>
                     ))}
               </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
               <ContextMenuSubTrigger>
                  <BarChart3 className="mr-2 size-4" /> {t('contextMenu.priority')}
               </ContextMenuSubTrigger>
               <ContextMenuSubContent className="w-48">
                  {priorities.map((priority) => (
                     <ContextMenuItem
                        key={priority.id}
                        onClick={() => handlePriorityChange(priority.id)}
                     >
                        <priority.icon className="size-4" /> {priority.name}
                     </ContextMenuItem>
                  ))}
               </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
               <ContextMenuSubTrigger>
                  <Tag className="mr-2 size-4" /> {t('contextMenu.labels')}
               </ContextMenuSubTrigger>
               <ContextMenuSubContent className="w-48">
                  {labels.map((label) => (
                     <ContextMenuItem key={label.id} onClick={() => handleLabelToggle(label.id)}>
                        <span
                           className="inline-block size-3 rounded-full"
                           style={{ backgroundColor: label.color }}
                           aria-hidden="true"
                        />
                        {label.name}
                     </ContextMenuItem>
                  ))}
               </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
               <ContextMenuSubTrigger>
                  <Folder className="mr-2 size-4" /> {t('contextMenu.project')}
               </ContextMenuSubTrigger>
               <ContextMenuSubContent className="w-64">
                  <ContextMenuItem onClick={() => handleProjectChange(null)}>
                     <Folder className="size-4" /> {t('contextMenu.noProject')}
                  </ContextMenuItem>
                  {projects.slice(0, 5).map((project) => (
                     <ContextMenuItem
                        key={project.id}
                        onClick={() => handleProjectChange(project.id)}
                     >
                        <project.icon className="size-4" /> {project.name}
                     </ContextMenuItem>
                  ))}
               </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuItem onClick={handleSetDueDate}>
               <CalendarClock className="size-4" /> {t('contextMenu.setDueDate')}
               <ContextMenuShortcut>D</ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuItem>
               <Pencil className="size-4" /> {t('contextMenu.rename')}
               <ContextMenuShortcut>R</ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuSeparator />

            <ContextMenuItem onClick={handleAddLink}>
               <LinkIcon className="size-4" /> {t('contextMenu.addLink')}
               <ContextMenuShortcut>Ctrl L</ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuSub>
               <ContextMenuSubTrigger>
                  <Repeat2 className="mr-2 size-4" /> {t('contextMenu.convertInto')}
               </ContextMenuSubTrigger>
               <ContextMenuSubContent className="w-48">
                  <ContextMenuItem>
                     <FileText className="size-4" /> {t('contextMenu.document')}
                  </ContextMenuItem>
                  <ContextMenuItem>
                     <MessageSquare className="size-4" /> {t('contextMenu.comment')}
                  </ContextMenuItem>
               </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuItem onClick={handleMakeCopy}>
               <CopyIcon className="size-4" /> {t('contextMenu.makeACopy')}
            </ContextMenuItem>
         </ContextMenuGroup>

         <ContextMenuSeparator />

         <ContextMenuItem onClick={handleCreateRelated}>
            <PlusSquare className="size-4" /> {t('contextMenu.createRelated')}
         </ContextMenuItem>

         <ContextMenuSub>
            <ContextMenuSubTrigger>
               <Flag className="mr-2 size-4" /> {t('contextMenu.markAs')}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
               <ContextMenuItem onClick={() => handleMarkAs(t('contextMenu.completed'))}>
                  <CheckCircle2 className="size-4" /> {t('contextMenu.completed')}
               </ContextMenuItem>
               <ContextMenuItem onClick={() => handleMarkAs(t('contextMenu.duplicate'))}>
                  <CopyIcon className="size-4" /> {t('contextMenu.duplicate')}
               </ContextMenuItem>
               <ContextMenuItem onClick={() => handleMarkAs(t('contextMenu.wontFix'))}>
                  <Clock className="size-4" /> {t('contextMenu.wontFix')}
               </ContextMenuItem>
            </ContextMenuSubContent>
         </ContextMenuSub>

         <ContextMenuItem onClick={handleMove}>
            <ArrowRightLeft className="size-4" /> {t('contextMenu.move')}
         </ContextMenuItem>

         <ContextMenuSeparator />

         <ContextMenuItem onClick={handleSubscribe}>
            <Bell className="size-4" />{' '}
            {isSubscribed ? t('contextMenu.unsubscribe') : t('contextMenu.subscribe')}
            <ContextMenuShortcut>S</ContextMenuShortcut>
         </ContextMenuItem>

         <ContextMenuItem onClick={handleFavorite}>
            <Star className="size-4" />{' '}
            {isFavorite ? t('contextMenu.unfavorite') : t('contextMenu.favorite')}
            <ContextMenuShortcut>F</ContextMenuShortcut>
         </ContextMenuItem>

         <ContextMenuItem onClick={handleCopy}>
            <Clipboard className="size-4" /> {t('contextMenu.copy')}
         </ContextMenuItem>

         <ContextMenuItem onClick={handleRemindMe}>
            <AlarmClock className="size-4" /> {t('contextMenu.remindMe')}
            <ContextMenuShortcut>H</ContextMenuShortcut>
         </ContextMenuItem>

         <ContextMenuSeparator />

         <ContextMenuItem variant="destructive">
            <Trash2 className="size-4" /> {t('contextMenu.delete')}
            <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
         </ContextMenuItem>
      </ContextMenuContent>
   );
}
