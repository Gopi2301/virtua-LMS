import type { Config } from 'tailwindcss';
import sharedConfig from '@virtua-lms/ui/tailwind.config';

const config: Pick<Config, 'prefix' | 'presets' | 'content'> = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [sharedConfig as Config],
};

export default config;
