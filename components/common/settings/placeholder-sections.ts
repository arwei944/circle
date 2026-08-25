/** Config of the generic settings pages that don't have a dedicated UI yet. */
export interface PlaceholderConfig {
   title: string;
   description?: string;
   actionLabel?: string;
   emptyLabel: string;
}

export const PLACEHOLDER_SECTIONS: Record<string, PlaceholderConfig> = {
   'slas': {
      title: 'placeholder.slas.title',
      description: 'placeholder.slas.description',
      actionLabel: 'placeholder.slas.actionLabel',
      emptyLabel: 'placeholder.slas.emptyLabel',
   },
   'project-labels': {
      title: 'placeholder.project-labels.title',
      actionLabel: 'placeholder.project-labels.actionLabel',
      emptyLabel: 'placeholder.project-labels.emptyLabel',
   },
   'project-templates': {
      title: 'placeholder.project-templates.title',
      actionLabel: 'placeholder.project-templates.actionLabel',
      emptyLabel: 'placeholder.project-templates.emptyLabel',
   },
   'project-updates': {
      title: 'placeholder.project-updates.title',
      description: 'placeholder.project-updates.description',
      emptyLabel: 'placeholder.project-updates.emptyLabel',
   },
   'initiatives': {
      title: 'placeholder.initiatives.title',
      description: 'placeholder.initiatives.description',
      actionLabel: 'placeholder.initiatives.actionLabel',
      emptyLabel: 'placeholder.initiatives.emptyLabel',
   },
   'documents': {
      title: 'placeholder.documents.title',
      actionLabel: 'placeholder.documents.actionLabel',
      emptyLabel: 'placeholder.documents.emptyLabel',
   },
   'customer-requests': {
      title: 'placeholder.customer-requests.title',
      description: 'placeholder.customer-requests.description',
      actionLabel: 'placeholder.customer-requests.actionLabel',
      emptyLabel: 'placeholder.customer-requests.emptyLabel',
   },
   'releases': {
      title: 'placeholder.releases.title',
      actionLabel: 'placeholder.releases.actionLabel',
      emptyLabel: 'placeholder.releases.emptyLabel',
   },
   'pulse': {
      title: 'placeholder.pulse.title',
      description: 'placeholder.pulse.description',
      emptyLabel: 'placeholder.pulse.emptyLabel',
   },
   'asks': {
      title: 'placeholder.asks.title',
      description: 'placeholder.asks.description',
      actionLabel: 'placeholder.asks.actionLabel',
      emptyLabel: 'placeholder.asks.emptyLabel',
   },
   'emojis': {
      title: 'placeholder.emojis.title',
      actionLabel: 'placeholder.emojis.actionLabel',
      emptyLabel: 'placeholder.emojis.emptyLabel',
   },
};
