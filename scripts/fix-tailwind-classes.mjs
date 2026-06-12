import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';
import path from 'path';

const replacements = {
  'bg-background': 'bg-white dark:bg-slate-950',
  'bg-card': 'bg-white dark:bg-slate-900',
  'bg-popover': 'bg-white dark:bg-slate-900',
  'bg-muted': 'bg-slate-100 dark:bg-slate-800',
  'text-foreground': 'text-slate-900 dark:text-slate-50',
  'text-card-foreground': 'text-slate-900 dark:text-slate-50',
  'text-muted-foreground': 'text-slate-500 dark:text-slate-400',
  'text-secondary-foreground': 'text-slate-600 dark:text-slate-300',
  'border-border': 'border-slate-200 dark:border-slate-800',
};

const files = globSync([
  'app/**/*.tsx',
  'components/**/*.tsx',
  '!node_modules/**'
]);

files.forEach(file => {
  let content = readFileSync(file, 'utf8');
  let changed = false;

  Object.entries(replacements).forEach(([old, newVal]) => {
    const regex = new RegExp(`\\b${old}\\b`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, newVal);
      changed = true;
    }
  });

  if (changed) {
    writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
  }
});

console.log('Done!');
