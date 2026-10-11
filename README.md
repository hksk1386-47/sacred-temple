# Sacred Temple API — servidor gratuito (Cloudflare)

Backend **100% no plano gratuito** do Cloudflare:

- **Workers** — API HTTP  
- **D1** — banco SQLite  

## O que este servidor faz

- Registrar / atualizar **perfis**
- **Buscar perfis** por nome ou @handle
- Publicar e listar **posts** (texto + link; mídia pesada ainda no cliente/R2 depois)
- **Apoiar / deixar de apoiar**
- Contar **views** de posts

Não inclui (ainda): live multi-espectador, chat realtime entre dispositivos, upload grande de vídeo (pode usar R2 depois).

---

## Deploy (passo a passo)

### 1. Conta Cloudflare

Crie em: https://dash.cloudflare.com/sign-up (grátis)

### 2. No computador

```bash
cd server
npm install
npx wrangler login
```

### 3. Criar banco D1

```bash
npm run db:create
```

A saída mostra um `database_id`. Abra `wrangler.toml` e **descomente** o bloco `[[d1_databases]]`, colando o id:

```toml
[[d1_databases]]
binding = "DB"
database_name = "sacred-temple-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 4. Migrar tabelas

```bash
npm run db:migrate
```

### 5. Publicar o Worker

```bash
npm run deploy
```

Você receberá uma URL tipo:

`https://sacred-temple-api.<seu-subdominio>.workers.dev`

### 6. Ligar no app (PWA)

1. Abra o Sacred Temple  
2. **Perfil → Configurar API** (ou o botão de servidor)  
3. Cole a URL do Worker (sem barra no final)  
4. Toque em **Sincronizar meu perfil**

Pronto: busca de perfis e apoio passam a usar o servidor.

---

## Testar a API

```bash
curl https://SEU-WORKER.workers.dev/api/health
```

---

## Frontend (Pages)

Publique a pasta `sacred-temple/` no **Cloudflare Pages** (também grátis).  
A API fica no Worker; o site no Pages.

---

## Custos

No plano free do Cloudflare (limites generosos para protótipo/hobby):

- Workers: requisições diárias incluídas  
- D1: armazenamento e leituras/escritas no free tier  

Consulte limites atuais no dashboard Cloudflare.

---

## Upload de músicas (R2) — link toca em qualquer aparelho

Para quem abre o link da música **ouvir o áudio** em outro celular:

### 1. Criar bucket R2 (grátis)

```bash
cd server
npx wrangler r2 bucket create sacred-temple-media
```

### 2. Ativar no `wrangler.toml`

Descomente:

```toml
[[r2_buckets]]
binding = "MEDIA"
bucket_name = "sacred-temple-media"
```

### 3. Migrar tabela de mídia + deploy

```bash
npx wrangler d1 executions execute sacred-temple-db --file=./migrations/0002_media.sql
# ou: npm run db:migrate  (se o script aplicar todos os .sql)
npm run deploy
```

### 4. No app

1. **Perfil → Configurar API** → URL do Worker  
2. **Sync automática após postar** = Ativada  
3. **Sincronizar perfil** uma vez  
4. Importe músicas de novo (ou toque Sincronizar para enviar as locais)

Cada faixa sobe para o R2. O link `?u=voce&i=id&k=music` passa a **tocar em qualquer dispositivo**.

### Limites sugeridos

- Arquivo máx. **25 MB** por upload  
- Plano free R2: armazenamento e operações generosos para uso pessoal  
