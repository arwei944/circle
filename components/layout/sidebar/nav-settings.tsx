'use client';

import {
   SidebarGroup,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
   Bell,
   Blocks,
   Bot,
   Code,
   Compass,
   FileText,
   Flame,
   HeartHandshake,
   KeyRound,
   LucideIcon,
   MessageCircleQuestion,
   Rocket,
   Settings,
   Smile,
   Sparkles,
   Tag,
   Target,
   UserRound,
   Users,
   Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface SettingsNavItem {
   name: string;
   /** Path under /{orgId}. */
   url: string;
   icon: LucideIcon;
}

interface SettingsNavGroup {
   label: string;
   items: SettingsNavItem[];
}

/** Linear-style settings navigation. */
export const settingsNav: SettingsNavGroup[] = [
   {
      label: 'settingsNav.personal',
      items: [
         { name: 'settingsNav.preferences', url: '/settings/preferences', icon: Settings },
         { name: 'settingsNav.profile', url: '/settings/profile', icon: UserRound },
         { name: 'settingsNav.notifications', url: '/settings/notifications', icon: Bell },
         { name: 'settingsNav.codeAndReviews', url: '/settings/code-and-reviews', icon: Code },
         { name: 'settingsNav.securityAndAccess', url: '/settings/security', icon: KeyRound },
         {
            name: 'settingsNav.connectedAccounts',
            url: '/settings/connected-accounts',
            icon: Users,
         },
         {
            name: 'settingsNav.agentPersonalization',
            url: '/settings/agent-personalization',
            icon: Bot,
         },
      ],
   },
   {
      label: 'settingsNav.issues',
      items: [
         { name: 'settingsNav.labels', url: '/settings/issue-labels', icon: Tag },
         { name: 'settingsNav.templates', url: '/settings/issue-templates', icon: FileText },
         { name: 'settingsNav.slas', url: '/settings/slas', icon: Flame },
      ],
   },
   {
      label: 'settingsNav.projects',
      items: [
         { name: 'settingsNav.labels', url: '/settings/project-labels', icon: Tag },
         { name: 'settingsNav.templates', url: '/settings/project-templates', icon: FileText },
         { name: 'settingsNav.statuses', url: '/settings/project-statuses', icon: Target },
         { name: 'settingsNav.updates', url: '/settings/project-updates', icon: Zap },
      ],
   },
   {
      label: 'settingsNav.features',
      items: [
         { name: 'settingsNav.aiAndAgents', url: '/settings/ai', icon: Sparkles },
         { name: 'settingsNav.initiatives', url: '/settings/initiatives', icon: Compass },
         { name: 'settingsNav.documents', url: '/settings/documents', icon: FileText },
         {
            name: 'settingsNav.customerRequests',
            url: '/settings/customer-requests',
            icon: HeartHandshake,
         },
         { name: 'settingsNav.releases', url: '/settings/releases', icon: Rocket },
         { name: 'settingsNav.pulse', url: '/settings/pulse', icon: Zap },
         { name: 'settingsNav.asks', url: '/settings/asks', icon: MessageCircleQuestion },
         { name: 'settingsNav.emojis', url: '/settings/emojis', icon: Smile },
         { name: 'settingsNav.integrations', url: '/settings/integrations', icon: Blocks },
      ],
   },
];

export function NavSettings() {
   const { orgId } = useParams<{ orgId: string }>();
   const pathname = usePathname();
   const t = useTranslations('common');

   return (
      <>
         {settingsNav.map((group) => (
            <SidebarGroup key={group.label} className="group-data-[collapsible=icon]:hidden">
               <SidebarGroupLabel>{t(group.label)}</SidebarGroupLabel>
               <SidebarMenu>
                  {group.items.map((item) => {
                     const href = `/${orgId}${item.url}`;
                     const isActive = pathname === href;
                     return (
                        <SidebarMenuItem key={`${group.label}-${item.name}`}>
                           <SidebarMenuButton asChild isActive={isActive}>
                              <Link href={href}>
                                 <item.icon className="size-4" />
                                 <span>{t(item.name)}</span>
                              </Link>
                           </SidebarMenuButton>
                        </SidebarMenuItem>
                     );
                  })}
               </SidebarMenu>
            </SidebarGroup>
         ))}
      </>
   );
}
