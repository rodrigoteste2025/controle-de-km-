CONTROLE DE QUILOMETRAGEM V3

IMPORTANTE:
Os arquivos devem ficar na raiz do GitHub Pages:
index.html
manifest.json
service-worker.js
css/
js/
icons/
supabase_tabelas_v3.sql

CONFIGURAR SUPABASE:
1. Abra js/config.js.
2. Coloque sua chave publishable:
   const SUPABASE_ANON_KEY = "sb_publishable_...";
3. Confirme:
   const USAR_SUPABASE = true;

BANCO:
1. Supabase > SQL Editor.
2. Execute o arquivo supabase_tabelas_v3.sql.

GITHUB PAGES:
Settings > Pages > Deploy from branch > main > / root.

CELULAR:
Abra o link do GitHub Pages no Chrome e toque em "Adicionar à tela inicial".
