import {defineConfig} from 'vite';
import {execSync} from 'node:child_process';

function git(command,fallback='unknown'){
  try{return execSync(command,{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()||fallback}catch{return fallback}
}
const buildSha=process.env.GITHUB_SHA||git('git rev-parse HEAD');
const buildDirty=git('git status --porcelain','')!=='';

export default defineConfig({
  base:'./',
  define:{
    __BUILD_SHA__:JSON.stringify(buildSha),
    __BUILD_DIRTY__:JSON.stringify(buildDirty)
  },
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
