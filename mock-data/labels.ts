export interface LabelInterface {
   id: string;
   name: string;
   color: string;
}

export const labels: LabelInterface[] = [
   { id: 'ui', name: 'UI 优化', color: 'purple' },
   { id: 'bug', name: '缺陷', color: 'red' },
   { id: 'feature', name: '功能', color: 'green' },
   { id: 'documentation', name: '文档', color: 'blue' },
   { id: 'refactor', name: '重构', color: 'yellow' },
   { id: 'performance', name: '性能', color: 'orange' },
   { id: 'design', name: '设计', color: 'pink' },
   { id: 'security', name: '安全', color: 'gray' },
   { id: 'accessibility', name: '无障碍', color: 'indigo' },
   { id: 'testing', name: '测试', color: 'teal' },
   { id: 'internationalization', name: '国际化', color: 'cyan' },
];
