import {defineConfig} from 'vite';

export default defineConfig({
  base:'./',
  build:{
    target:'es2020',
    rollupOptions:{
      output:{
        manualChunks(id){
          if(id.includes('node_modules/three'))return 'three';
        }
      }
    }
  }
});
