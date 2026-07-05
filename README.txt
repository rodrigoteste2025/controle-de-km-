# Controle de Quilometragem IDAF - PWA

Arquivos:
- index.html
- manifest.json
- service-worker.js
- supabase_tabelas.sql
- pasta icons

## Como usar como app no celular

1. Suba essa pasta no Netlify, GitHub Pages ou Vercel.
2. Abra o link no celular.
3. No Android/Chrome: toque nos três pontinhos e escolha "Adicionar à tela inicial".
4. No iPhone/Safari: toque em Compartilhar e depois "Adicionar à Tela de Início".

## Como configurar Supabase

1. Crie um projeto no Supabase.
2. Vá em SQL Editor.
3. Cole e execute o conteúdo do arquivo supabase_tabelas.sql.
4. No Supabase, vá em Project Settings > API.
5. Copie:
   - Project URL
   - anon public key
6. Abra o index.html e altere:

const SUPABASE_URL = "COLE_AQUI_A_URL_DO_SUPABASE";
const SUPABASE_ANON_KEY = "COLE_AQUI_A_CHAVE_ANON_PUBLIC";
const USAR_SUPABASE = true;

7. Salve, suba novamente os arquivos e use o botão "Sincronizar Dados".

Observação: o app funciona offline no celular usando LocalStorage. Quando houver internet, clique em "Sincronizar Dados".
