import { MantineTheme } from '@mantine/core';

export function getStatusColor(status: string, theme: MantineTheme): string {
  switch (status) {
    case 'pending':
      return theme.colors.orange[5];
    case 'executing':
      return theme.colors.blue[5];
    case 'streaming':
      return theme.colors.indigo[5];
    case 'evaluated':
      return theme.colors.green[5];
    case 'error':
      return theme.colors.red[5];
    default:
      return theme.colors.gray[5];
  }
}