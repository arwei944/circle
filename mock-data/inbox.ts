import { Issue, issues } from './issues';
import { User, users } from './users';

export type NotificationType =
   | 'comment'
   | 'mention'
   | 'assignment'
   | 'status'
   | 'reopened'
   | 'closed'
   | 'edited'
   | 'created'
   | 'upload';

/**
 * An inbox notification. It extends the real `Issue` it belongs to
 * (found by identifier) so the preview pane can show the actual issue.
 */
export interface InboxItem extends Issue {
   /** Notification-specific fields */
   content: string;
   type: NotificationType;
   user: User;
   timestamp: string;
   read: boolean;
}

/**
 * Notification seeds referencing REAL issues by identifier:
 * [identifier, type, actorIdx (users), content, timestamp, read]
 */
type InboxSeed = [string, NotificationType, number, string, string, boolean];

const seeds: InboxSeed[] = [
   [
      'LNUI-703',
      'comment',
      1,
      '提醒一下：Radix 通过 DismissableLayer 树解决了这个问题 — 在重新造轮子之前值得读一下。',
      '2小时前',
      false,
   ],
   ['LNUI-710', 'status', 3, '将此问题标记为被 LNUI-707 阻塞', '4小时前', false],
   [
      'LNUI-704',
      'mention',
      4,
      '@leonel.ngoya 你能在自己机器上检查一下窗口化的 overscan 值吗？',
      '6小时前',
      false,
   ],
   ['LNUI-726', 'closed', 4, '将此问题从「进行中」移至「已完成」', '9小时前', false],
   [
      'LNUI-701',
      'comment',
      7,
      '在 Firefox 和 Safari 上也已复现 — 反向迭代器从 index 而不是 index - 1 开始。',
      '12小时前',
      false,
   ],
   ['LNUI-736', 'created', 5, '创建了此问题并将其加入周期 21', '1天前', true],
   ['LNUI-715', 'assignment', 9, '将此问题分配给你', '1天前', false],
   [
      'LNUI-702',
      'comment',
      13,
      '设计上同意在低端设备上用简单的透明度交叉淡入淡出 — 以 prefers-reduced-motion 为判断依据。',
      '2天前',
      true,
   ],
   ['LNUI-819', 'created', 16, '根据文档反馈创建了此问题', '2天前', true],
   ['LNUI-706', 'edited', 12, '更新了描述中的令牌映射部分', '3天前', true],
   ['LNUI-735', 'closed', 3, '将此问题从「技术评审」移至「已发布」', '3天前', true],
   [
      'LNUI-722',
      'mention',
      19,
      '@leonel.ngoya CVD 模拟看起来不错 — 本周能确定锚点吗？',
      '4天前',
      true,
   ],
   ['LNUI-744', 'reopened', 0, '重新打开了此问题 — 在 iOS 19 beta 上仍可复现', '5天前', true],
   ['LNUI-731', 'upload', 14, '附上了搜索索引基准测试结果', '6天前', true],
];

const issueByIdentifier = new Map(issues.map((issue) => [issue.identifier, issue]));

export const inboxItems: InboxItem[] = seeds
   .map(([identifier, type, actorIdx, content, timestamp, read], index) => {
      const issue = issueByIdentifier.get(identifier);
      if (!issue) return null;

      return {
         ...issue,
         id: `notification-${index + 1}`,
         content,
         type,
         user: users[actorIdx],
         timestamp,
         read,
      };
   })
   .filter((item): item is InboxItem => item !== null);
