import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
// Fixed module order, no external dependencies. Only these single-line import and
// named declaration exports are supported. Fail rather than emit unresolved imports.
const files=['model.js','styles.js','editor.js','card.js'];
const parts=await Promise.all(files.map(async file=>{
  let source=await readFile(resolve(root,'src',file),'utf8');
  source=source.replace(/^import .+;\r?\n/gm,'').replace(/^export (?=(const|class|function) )/gm,'');
  if(/^\s*(import|export)\s/m.test(source))throw new Error(`Unsupported module syntax: ${file}`);
  return `// ${file}\n${source}`;
}));
await mkdir(resolve(root,'dist'),{recursive:true});
await writeFile(resolve(root,'dist/printer-card.js'),`/*! Printer Card v${pkg.version} | MIT License */\n${parts.join('\n')}\nexport {};\n`);
console.log(`Built dist/printer-card.js (${pkg.version})`);
