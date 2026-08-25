'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from '@/components/ui/command';
import { cycles, formatCycleDateRange } from '@/mock-data/cycles';
import { Issue } from '@/mock-data/issues';
import { labels as allLabels } from '@/mock-data/labels';
import { priorities } from '@/mock-data/priorities';
import { projects as allProjects } from '@/mock-data/projects';
import { status as allStatus } from '@/mock-data/status';
import { teams } from '@/mock-data/teams';
import { users } from '@/mock-data/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCreateIssueStore } from '@/store/create-issue-store';
import { useIssuesStore } from '@/store/issues-store';
import {
   Box,
   CalendarPlus,
   Check,
   CircleDot,
   Clipboard,
   ClipboardList,
   ClipboardType,
   Compass,
   ContactRound,
   FileText,
   GitBranch,
   Inbox,
   Layers,
   Link2,
   PackagePlus,
   SquarePen,
   Tags,
   Type,
   UserRound,
   UserRoundMinus,
   UserRoundPlus,
   Users,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type PaletteRoute =
   | 'root'
   | 'assign'
   | 'status'
   | 'priority'
   | 'labels'
   | 'project'
   | 'cycle'
   | 'team'
   | 'due-date';

/** Small keyboard hint chips on the right of a command row. */
function Keys({ keys }: { keys: string[] }) {
   return (
      <span className="ml-auto flex items-center gap-1">
         {keys.map((key, index) => (
            <kbd
               key={index}
               className="min-w-5 h-5 px-1 inline-flex items-center justify-center rounded border bg-muted/50 text-[11px] text-muted-foreground font-sans"
            >
               {key}
            </kbd>
         ))}
      </span>
   );
}

/** ⌘K command palette — Linear-style, aware of the issue in context. */
export function CommandPalette() {
   const [open, setOpen] = useState(false);
   const [route, setRoute] = useState<PaletteRoute>('root');
   const [query, setQuery] = useState('');
   /** When true, the issue context chip was dismissed with ⌫. */
   const [contextCleared, setContextCleared] = useState(false);

   const pathname = usePathname();
   const router = useRouter();
   const t = useTranslations('common');
   const {
      issues,
      updateIssueStatus,
      updateIssuePriority,
      updateIssueAssignee,
      addIssueLabel,
      removeIssueLabel,
      updateIssueProject,
      updateIssue,
   } = useIssuesStore();
   const { openModal } = useCreateIssueStore();

   const orgId = pathname.split('/')[1] || 'lndev-ui';

   const contextIssue = useMemo<Issue | undefined>(() => {
      const match = pathname.match(/^\/[^/]+\/issue\/([^/]+)/);
      if (!match) return undefined;
      return issues.find((issue) => issue.identifier === match[1]);
   }, [pathname, issues]);

   const issue = contextCleared ? undefined : contextIssue;

   const reset = useCallback(() => {
      setRoute('root');
      setQuery('');
      setContextCleared(false);
   }, []);

   const close = useCallback(() => {
      setOpen(false);
      reset();
   }, [reset]);

   // ⌘K / Ctrl+K
   useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
         if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            setOpen((value) => {
               if (value) reset();
               return !value;
            });
         }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
   }, [reset]);

   const copy = useCallback(
      async (label: string, text: string) => {
         try {
            await navigator.clipboard.writeText(text);
            toast.success(t('commandPalette.toast.copied', { label }));
         } catch {
            toast.error(t('commandPalette.toast.clipboardError'));
         }
         close();
      },
      [close, t]
   );

   const issueUrl = issue
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${orgId}/issue/${issue.identifier}`
      : '';
   const branchName = issue
      ? `${users[0].id}/${issue.identifier.toLowerCase()}-${issue.title
           .toLowerCase()
           .replace(/[^a-z0-9]+/g, '-')
           .replace(/^-|-$/g, '')
           .slice(0, 40)}`
      : '';

   const go = (path: string) => {
      router.push(`/${orgId}${path}`);
      close();
   };

   const input = (
      <div className="relative">
         <CommandInput
            autoFocus
            placeholder={t('commandPalette.searchPlaceholder')}
            value={query}
            onValueChange={setQuery}
            onKeyDown={(event) => {
               if (event.key === 'Escape' && route !== 'root') {
                  event.preventDefault();
                  event.stopPropagation();
                  setRoute('root');
                  setQuery('');
               }
               if (event.key === 'Backspace' && query === '' && route !== 'root') {
                  setRoute('root');
               }
               if (event.key === 'Tab' && route === 'root') {
                  event.preventDefault();
                  go('/agent');
               }
            }}
         />
         {route === 'root' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-muted-foreground pointer-events-none">
               {t('commandPalette.askAgent')}
               <kbd className="h-5 px-1.5 inline-flex items-center rounded border bg-muted/50 text-[11px] font-sans">
                  Tab
               </kbd>
            </span>
         )}
      </div>
   );

   return (
      <Dialog
         open={open}
         onOpenChange={(value) => {
            setOpen(value);
            if (!value) reset();
         }}
      >
         <DialogContent
            showCloseButton={false}
            className="overflow-hidden p-0 sm:max-w-2xl top-[22%] translate-y-0 gap-0"
         >
            <DialogTitle className="sr-only">{t('commandPalette.commandMenu')}</DialogTitle>
            <DialogDescription className="sr-only">
               {t('commandPalette.searchDescription')}
            </DialogDescription>
            <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5">
               {issue && (
                  <div className="flex items-center gap-1.5 px-3 pt-3 pb-1">
                     <span className="inline-flex items-center gap-1.5 max-w-full rounded-md bg-muted/70 border border-border/60 px-2 py-1 text-xs">
                        <span className="text-muted-foreground shrink-0">{issue.identifier} ⋅</span>
                        <span className="truncate">{issue.title}</span>
                        <button
                           tabIndex={-1}
                           onClick={() => setContextCleared(true)}
                           className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                           aria-label={t('commandPalette.clearIssueContext')}
                        >
                           ⌫
                        </button>
                     </span>
                  </div>
               )}
               {input}
               <CommandList className="max-h-96">
                  <CommandEmpty>{t('commandPalette.noResults')}</CommandEmpty>

                  {route === 'root' && issue && (
                     <>
                        <CommandGroup heading={t('commandPalette.issueHeading')}>
                           <CommandItem
                              onSelect={() => {
                                 setRoute('assign');
                                 setQuery('');
                              }}
                           >
                              <UserRoundPlus className="text-muted-foreground" />
                              {t('commandPalette.assignTo')}
                              <Keys keys={['A']} />
                           </CommandItem>
                           <CommandItem
                              onSelect={() => {
                                 updateIssueAssignee(issue.id, null);
                                 toast.success(t('commandPalette.toast.unassigned'));
                                 close();
                              }}
                           >
                              <UserRoundMinus className="text-muted-foreground" />
                              {t('commandPalette.unassign')}
                              <Keys keys={['I']} />
                           </CommandItem>
                           <CommandItem
                              onSelect={() => {
                                 setRoute('status');
                                 setQuery('');
                              }}
                           >
                              <CircleDot className="text-muted-foreground" />
                              {t('commandPalette.changeStatus')}
                              <Keys keys={['S']} />
                           </CommandItem>
                           <CommandItem
                              onSelect={() => {
                                 setRoute('priority');
                                 setQuery('');
                              }}
                           >
                              <Layers className="text-muted-foreground" />
                              {t('commandPalette.setPriority')}
                              <Keys keys={['P']} />
                           </CommandItem>
                           <CommandItem
                              onSelect={() => {
                                 setRoute('project');
                                 setQuery('');
                              }}
                           >
                              <Box className="text-muted-foreground" />
                              {t('commandPalette.moveToProject')}
                              <Keys keys={['⇧', 'P']} />
                           </CommandItem>
                           <CommandItem
                              onSelect={() => {
                                 setRoute('labels');
                                 setQuery('');
                              }}
                           >
                              <Tags className="text-muted-foreground" />
                              {t('commandPalette.changeOrAddLabels')}
                              <Keys keys={['L']} />
                           </CommandItem>
                           <CommandItem
                              onSelect={() => {
                                 setRoute('cycle');
                                 setQuery('');
                              }}
                           >
                              <CircleDot className="text-muted-foreground" />
                              {t('commandPalette.moveToCycle')}
                              <Keys keys={['⇧', 'C']} />
                           </CommandItem>
                           <CommandItem
                              onSelect={() => {
                                 toast.success(t('commandPalette.toast.addedToNextRelease'));
                                 close();
                              }}
                           >
                              <PackagePlus className="text-muted-foreground" />
                              {t('commandPalette.addToRelease')}
                              <Keys keys={['⌥', 'R']} />
                           </CommandItem>
                           <CommandItem
                              onSelect={() => {
                                 setRoute('team');
                                 setQuery('');
                              }}
                           >
                              <Users className="text-muted-foreground" />
                              {t('commandPalette.moveToDifferentTeam')}
                              <Keys keys={['⌘', '⇧', 'M']} />
                           </CommandItem>
                           <CommandItem
                              onSelect={() => {
                                 setRoute('due-date');
                                 setQuery('');
                              }}
                           >
                              <CalendarPlus className="text-muted-foreground" />
                              {t('commandPalette.setDueDate')}
                              <Keys keys={['⇧', 'D']} />
                           </CommandItem>
                        </CommandGroup>
                        <CommandGroup heading={t('commandPalette.copyHeading')}>
                           <CommandItem
                              onSelect={() =>
                                 copy(t('commandPalette.copyLabel.issueId'), issue.identifier)
                              }
                           >
                              <Clipboard className="text-muted-foreground" />
                              {t('commandPalette.copyIssueId')}
                              <Keys keys={['⌘', '.']} />
                           </CommandItem>
                           <CommandItem
                              onSelect={() =>
                                 copy(t('commandPalette.copyLabel.issueUrl'), issueUrl)
                              }
                           >
                              <Link2 className="text-muted-foreground" />
                              {t('commandPalette.copyIssueUrl')}
                              <Keys keys={['⌘', '⇧', ',']} />
                           </CommandItem>
                           <CommandItem
                              onSelect={() =>
                                 copy(t('commandPalette.copyLabel.issueTitle'), issue.title)
                              }
                           >
                              <Type className="text-muted-foreground" />
                              {t('commandPalette.copyIssueTitle')}
                              <Keys keys={['⌘', '⇧', "'"]} />
                           </CommandItem>
                           <CommandItem
                              onSelect={() =>
                                 copy(
                                    t('commandPalette.copyLabel.titleLink'),
                                    `[${issue.identifier}: ${issue.title}](${issueUrl})`
                                 )
                              }
                           >
                              <Link2 className="text-muted-foreground" />
                              {t('commandPalette.copyTitleAsLink')}
                              <Keys keys={['⌘', 'C']} />
                           </CommandItem>
                           <CommandItem
                              onSelect={() =>
                                 copy(
                                    t('commandPalette.copyLabel.description'),
                                    issue.description || issue.title
                                 )
                              }
                           >
                              <FileText className="text-muted-foreground" />
                              {t('commandPalette.copyDescriptionAsMarkdown')}
                           </CommandItem>
                           <CommandItem
                              onSelect={() =>
                                 copy(
                                    t('commandPalette.copyLabel.issueContent'),
                                    t('commandPalette.issueContentMarkdown', {
                                       identifier: issue.identifier,
                                       title: issue.title,
                                       description: issue.description || '',
                                       status: issue.status.name,
                                       priority: issue.priority.name,
                                       assignee:
                                          issue.assignee?.name ?? t('commandPalette.unassigned'),
                                    })
                                 )
                              }
                           >
                              <ClipboardType className="text-muted-foreground" />
                              {t('commandPalette.copyContentAsMarkdown')}
                              <Keys keys={['⌘', '⌥', 'C']} />
                           </CommandItem>
                           <CommandItem
                              onSelect={() =>
                                 copy(t('commandPalette.copyLabel.branchName'), branchName)
                              }
                           >
                              <GitBranch className="text-muted-foreground" />
                              {t('commandPalette.copyGitBranchName')}
                              <Keys keys={['⌘', '⇧', '.']} />
                           </CommandItem>
                           <CommandItem
                              onSelect={() =>
                                 copy(
                                    t('commandPalette.copyLabel.prompt'),
                                    t('commandPalette.prompt', {
                                       identifier: issue.identifier,
                                       title: issue.title,
                                       description: issue.description || '',
                                       status: issue.status.name,
                                       priority: issue.priority.name,
                                    })
                                 )
                              }
                           >
                              <ClipboardList className="text-muted-foreground" />
                              {t('commandPalette.copyAsPrompt')}
                              <Keys keys={['⌘', '⌥', 'P']} />
                           </CommandItem>
                        </CommandGroup>
                     </>
                  )}

                  {route === 'root' && !issue && (
                     <>
                        <CommandGroup heading={t('commandPalette.actionsHeading')}>
                           <CommandItem
                              onSelect={() => {
                                 openModal();
                                 close();
                              }}
                           >
                              <SquarePen className="text-muted-foreground" />
                              {t('commandPalette.createNewIssue')}
                              <Keys keys={['C']} />
                           </CommandItem>
                        </CommandGroup>
                        <CommandGroup heading={t('commandPalette.goToHeading')}>
                           <CommandItem onSelect={() => go('/inbox')}>
                              <Inbox className="text-muted-foreground" /> {t('sidebar.inbox')}
                              <Keys keys={['G', 'I']} />
                           </CommandItem>
                           <CommandItem onSelect={() => go('/my-issues')}>
                              <ClipboardList className="text-muted-foreground" />{' '}
                              {t('sidebar.myIssues')}
                              <Keys keys={['G', 'M']} />
                           </CommandItem>
                           <CommandItem onSelect={() => go('/reviews')}>
                              <GitBranch className="text-muted-foreground" /> {t('sidebar.reviews')}
                           </CommandItem>
                           <CommandItem onSelect={() => go('/initiatives')}>
                              <Compass className="text-muted-foreground" />{' '}
                              {t('sidebar.initiatives')}
                           </CommandItem>
                           <CommandItem onSelect={() => go('/projects')}>
                              <Box className="text-muted-foreground" /> {t('sidebar.projects')}
                              <Keys keys={['G', 'P']} />
                           </CommandItem>
                           <CommandItem onSelect={() => go('/views')}>
                              <Layers className="text-muted-foreground" /> {t('sidebar.views')}
                           </CommandItem>
                           <CommandItem onSelect={() => go('/teams')}>
                              <ContactRound className="text-muted-foreground" />{' '}
                              {t('sidebar.teams')}
                           </CommandItem>
                           <CommandItem onSelect={() => go('/members')}>
                              <UserRound className="text-muted-foreground" /> {t('sidebar.members')}
                           </CommandItem>
                           <CommandItem onSelect={() => go('/settings')}>
                              <FileText className="text-muted-foreground" /> {t('sidebar.settings')}
                              <Keys keys={['G', 'S']} />
                           </CommandItem>
                        </CommandGroup>
                     </>
                  )}

                  {route === 'assign' && issue && (
                     <CommandGroup heading={t('commandPalette.assignTo')}>
                        {users.slice(0, 12).map((user) => (
                           <CommandItem
                              key={user.id}
                              onSelect={() => {
                                 updateIssueAssignee(issue.id, user);
                                 toast.success(
                                    t('commandPalette.toast.assignedTo', { name: user.name })
                                 );
                                 close();
                              }}
                           >
                              <Avatar className="size-5">
                                 <AvatarImage src={user.avatarUrl} alt={user.name} />
                                 <AvatarFallback className="text-[9px]">
                                    {user.name[0]}
                                 </AvatarFallback>
                              </Avatar>
                              {user.name}
                              {issue.assignee?.id === user.id && (
                                 <Check className="ml-auto size-4" />
                              )}
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  )}

                  {route === 'status' && issue && (
                     <CommandGroup heading={t('commandPalette.changeStatus')}>
                        {allStatus.map((candidate) => (
                           <CommandItem
                              key={candidate.id}
                              onSelect={() => {
                                 updateIssueStatus(issue.id, candidate);
                                 toast.success(
                                    t('commandPalette.toast.statusSetTo', { name: candidate.name })
                                 );
                                 close();
                              }}
                           >
                              <candidate.icon />
                              {candidate.name}
                              {issue.status.id === candidate.id && (
                                 <Check className="ml-auto size-4" />
                              )}
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  )}

                  {route === 'priority' && issue && (
                     <CommandGroup heading={t('commandPalette.setPriority')}>
                        {priorities.map((candidate) => (
                           <CommandItem
                              key={candidate.id}
                              onSelect={() => {
                                 updateIssuePriority(issue.id, candidate);
                                 toast.success(
                                    t('commandPalette.toast.prioritySetTo', {
                                       name: candidate.name,
                                    })
                                 );
                                 close();
                              }}
                           >
                              <candidate.icon className="text-muted-foreground" />
                              {candidate.name}
                              {issue.priority.id === candidate.id && (
                                 <Check className="ml-auto size-4" />
                              )}
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  )}

                  {route === 'labels' && issue && (
                     <CommandGroup heading={t('commandPalette.changeOrAddLabels')}>
                        {allLabels.map((label) => {
                           const active = issue.labels.some(
                              (candidate) => candidate.id === label.id
                           );
                           return (
                              <CommandItem
                                 key={label.id}
                                 onSelect={() => {
                                    if (active) removeIssueLabel(issue.id, label.id);
                                    else addIssueLabel(issue.id, label);
                                    toast.success(
                                       active
                                          ? t('commandPalette.toast.labelRemoved', {
                                               name: label.name,
                                            })
                                          : t('commandPalette.toast.labelAdded', {
                                               name: label.name,
                                            })
                                    );
                                 }}
                              >
                                 <span
                                    className="size-3 rounded-full"
                                    style={{ backgroundColor: label.color }}
                                 />
                                 {label.name}
                                 {active && <Check className="ml-auto size-4" />}
                              </CommandItem>
                           );
                        })}
                     </CommandGroup>
                  )}

                  {route === 'project' && issue && (
                     <CommandGroup heading={t('commandPalette.moveToProject')}>
                        <CommandItem
                           onSelect={() => {
                              updateIssueProject(issue.id, undefined);
                              toast.success(t('commandPalette.toast.removedFromProject'));
                              close();
                           }}
                        >
                           <Box className="text-muted-foreground" />
                           {t('commandPalette.noProject')}
                        </CommandItem>
                        {allProjects.map((project) => (
                           <CommandItem
                              key={project.id}
                              onSelect={() => {
                                 updateIssueProject(issue.id, project);
                                 toast.success(
                                    t('commandPalette.toast.movedTo', { name: project.name })
                                 );
                                 close();
                              }}
                           >
                              <project.icon className="text-muted-foreground" />
                              {project.name}
                              {issue.project?.id === project.id && (
                                 <Check className="ml-auto size-4" />
                              )}
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  )}

                  {route === 'cycle' && issue && (
                     <CommandGroup heading={t('commandPalette.moveToCycle')}>
                        <CommandItem
                           onSelect={() => {
                              updateIssue(issue.id, { cycleId: '' });
                              toast.success(t('commandPalette.toast.removedFromCycle'));
                              close();
                           }}
                        >
                           <CircleDot className="text-muted-foreground" />
                           {t('commandPalette.noCycle')}
                        </CommandItem>
                        {cycles.slice(0, 6).map((cycle) => (
                           <CommandItem
                              key={cycle.id}
                              onSelect={() => {
                                 updateIssue(issue.id, { cycleId: cycle.id });
                                 toast.success(
                                    t('commandPalette.toast.movedTo', { name: cycle.name })
                                 );
                                 close();
                              }}
                           >
                              <CircleDot className="text-muted-foreground" />
                              {cycle.name}
                              <span className="text-xs text-muted-foreground ml-2">
                                 {formatCycleDateRange(cycle)}
                              </span>
                              {issue.cycleId === cycle.id && <Check className="ml-auto size-4" />}
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  )}

                  {route === 'team' && issue && (
                     <CommandGroup heading={t('commandPalette.moveToDifferentTeam')}>
                        {teams
                           .filter((team) => team.joined)
                           .map((team) => (
                              <CommandItem
                                 key={team.id}
                                 onSelect={() => {
                                    toast.success(
                                       t('commandPalette.toast.movedTo', { name: team.name })
                                    );
                                    close();
                                 }}
                              >
                                 <span className="text-sm">{team.icon}</span>
                                 {team.name}
                              </CommandItem>
                           ))}
                     </CommandGroup>
                  )}

                  {route === 'due-date' && issue && (
                     <CommandGroup heading={t('commandPalette.setDueDate')}>
                        {(
                           [
                              [t('commandPalette.today'), '2026-08-04'],
                              [t('commandPalette.tomorrow'), '2026-08-05'],
                              [t('commandPalette.endOfThisWeek'), '2026-08-09'],
                              [t('commandPalette.inOneWeek'), '2026-08-11'],
                           ] as const
                        ).map(([label, date]) => (
                           <CommandItem
                              key={label}
                              onSelect={() => {
                                 updateIssue(issue.id, { dueDate: date });
                                 toast.success(
                                    t('commandPalette.toast.dueDateSet', { date: label })
                                 );
                                 close();
                              }}
                           >
                              <CalendarPlus className="text-muted-foreground" />
                              {label}
                           </CommandItem>
                        ))}
                        <CommandItem
                           onSelect={() => {
                              updateIssue(issue.id, { dueDate: undefined });
                              toast.success(t('commandPalette.toast.dueDateCleared'));
                              close();
                           }}
                        >
                           <CalendarPlus className="text-muted-foreground" />
                           {t('commandPalette.clearDueDate')}
                        </CommandItem>
                     </CommandGroup>
                  )}
               </CommandList>
            </Command>
         </DialogContent>
      </Dialog>
   );
}
