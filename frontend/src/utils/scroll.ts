export const scrollIntoView = (
  element: Element | null,
  block: ScrollLogicalPosition = 'nearest',
) => {
  element?.scrollIntoView({ block, inline: 'nearest' });
};
