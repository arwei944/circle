import {
   Bot,
   GitPullRequestArrow,
   Inbox,
   FolderKanban,
   ContactRound,
   Box,
   Settings,
   Bell,
   KeyRound,
   Users,
   Tag,
   Layers,
   FileText,
   MessageSquare,
   Clock,
   Zap,
   UserRound,
} from 'lucide-react';

export const inboxItems = [
   {
      name: '收件箱',
      url: '/lndev-ui/inbox',
      icon: Inbox,
   },
   {
      name: '评审',
      url: '/lndev-ui/reviews',
      icon: GitPullRequestArrow,
   },
   {
      name: '我的问题',
      url: '/lndev-ui/my-issues',
      icon: FolderKanban,
   },
   {
      name: '智能助手',
      url: '/lndev-ui/agent',
      icon: Bot,
   },
];

export const workspaceItems = [
   {
      name: '团队',
      url: '/lndev-ui/teams',
      icon: ContactRound,
   },
   {
      name: '项目',
      url: '/lndev-ui/projects',
      icon: Box,
   },
   {
      name: '成员',
      url: '/lndev-ui/members',
      icon: UserRound,
   },
];

export const accountItems = [
   {
      name: '账户',
      url: '/settings/account',
      icon: UserRound,
   },
   {
      name: '偏好设置',
      url: '/settings/preferences',
      icon: Settings,
   },
   {
      name: '个人资料',
      url: '/settings/profile',
      icon: UserRound,
   },
   {
      name: '通知',
      url: '/settings/notifications',
      icon: Bell,
   },
   {
      name: '安全与访问',
      url: '/settings/security',
      icon: KeyRound,
   },
   {
      name: '关联账户',
      url: '/settings/connected-accounts',
      icon: Users,
   },
];

export const featuresItems = [
   {
      name: '标签',
      url: '/settings/labels',
      icon: Tag,
   },
   {
      name: '项目',
      url: '/settings/projects',
      icon: Box,
   },
   {
      name: '计划',
      url: '/settings/initiatives',
      icon: Layers,
   },
   {
      name: '客户请求',
      url: '/settings/customer-requests',
      icon: Inbox,
   },
   {
      name: '模板',
      url: '/settings/templates',
      icon: FileText,
   },
   {
      name: '提问',
      url: '/settings/asks',
      icon: MessageSquare,
   },
   {
      name: '服务水平协议',
      url: '/settings/slas',
      icon: Clock,
   },
   {
      name: '表情',
      url: '/settings/emojis',
      icon: MessageSquare,
   },
   {
      name: '集成',
      url: '/settings/integrations',
      icon: Zap,
   },
];
