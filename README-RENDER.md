# Subir o painel no Render gratis

Este painel pode rodar no plano gratis do Render para teste.

## Passos

1. Acesse `https://render.com`.
2. Crie uma conta ou entre na sua conta.
3. Suba esta pasta `server` para um repositorio no GitHub.
4. No Render, clique em `New`.
5. Escolha `Web Service`.
6. Conecte o repositorio do GitHub.
7. Configure:

```text
Name: tv-launcher-panel
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

8. Em `Environment Variables`, coloque:

```text
ADMIN_PASSWORD=sua-senha-do-painel
PUBLIC_BASE_URL=https://nome-do-seu-app.onrender.com
```

9. Clique em `Deploy Web Service`.

Depois do deploy, abra:

```text
https://nome-do-seu-app.onrender.com
```

## Importante sobre o plano gratis

No plano gratis do Render:

- o servidor pode demorar cerca de 1 minuto para abrir depois de ficar parado;
- uploads e banco local podem ser perdidos quando o servidor reinicia;
- serve para testar, mas para uso real precisamos ligar banco/armazenamento persistente.

Quando voce me mandar a URL do Render, eu gero um novo APK apontando para ela.
