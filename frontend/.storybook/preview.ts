import type { Preview } from '@storybook/react-vite'
import { createElement } from 'react'
import { ThemeProvider } from '../src/components/theme-provider'
import '../src/index.css'
import '@xyflow/react/dist/style.css'

const preview: Preview = {
  decorators: [
    (Story) => createElement(ThemeProvider, null, createElement(Story)),
  ],
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;
