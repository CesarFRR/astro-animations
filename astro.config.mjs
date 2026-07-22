import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://cesarrfr.github.io',
  base: '/astro-animations',
  output: 'static',
  vite: {
    optimizeDeps: {
      include: ['three', 'gsap']
    }
  }
});
