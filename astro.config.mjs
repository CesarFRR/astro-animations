import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://astronomia-para-todos.github.io',
  base: '/astro-animations',
  output: 'static',
  vite: {
    optimizeDeps: {
      include: ['three', 'gsap']
    }
  }
});
