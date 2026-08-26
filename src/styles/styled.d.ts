import 'styled-components';
import type { AppTheme } from './theme';

// Declaration merging so styled-components' `theme` prop is fully typed as AppTheme.
declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DefaultTheme extends AppTheme {}
}
