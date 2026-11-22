# Automação própria: comentários para DM no Instagram

Esta aplicação é uma base independente, sem Manychat. Ela inclui:

- painel local para trocar palavra-chave, material e mensagens;
- endpoint de validação e recebimento de Webhooks (`/webhook`);
- validação de assinatura HMAC da Meta;
- modo de simulação, que não envia mensagens enquanto a conta Meta não estiver pronta.

## Limitação importante: checagem de seguidor

A API pública do Instagram disponibiliza eventos de comentários e permite respostas privadas, mas não oferece, de forma geral, uma consulta que confirme que uma conta individual segue a sua. Portanto, esta base começa em `manual_review`: pede confirmação e impede o envio automático do material. Não habilite uma API, scraping ou automação de navegador que tente contornar essa limitação.

Quando a Meta conceder à sua aplicação uma capacidade aprovada de relação de seguidor, implemente a consulta em `handleComment` e selecione `approved_api` no painel. Até essa implementação existir, o código **nunca libera automaticamente** o material: ele só envia a mensagem de orientação.

## Publicar na Vercel + Neon

1. Crie um banco no Neon e copie a connection string para `DATABASE_URL`.
2. Importe este diretório como projeto na Vercel. Ela reconhecerá as funções em `api/` e gerará uma URL HTTPS pública.
3. Em **Settings → Environment Variables**, cadastre `DATABASE_URL`, `WEBHOOK_VERIFY_TOKEN`, `META_APP_SECRET`, `META_ACCESS_TOKEN`, `META_GRAPH_VERSION` e `DASHBOARD_API_KEY`.
4. Em produção, configure a URL `https://SEU-PROJETO.vercel.app/webhook` no aplicativo Meta.

Os dados de campanha passam a ficar no Neon; o filesystem da Vercel não é usado para persistência.

## Rodar localmente

1. Copie `.env.example` para `.env` e defina `WEBHOOK_VERIFY_TOKEN` com um valor longo.
2. Execute `node server.js`.
3. Abra `http://localhost:3000` e preencha a campanha.
4. Para receber chamadas da Meta, publique o servidor em uma URL HTTPS e cadastre `https://SEU-DOMINIO/webhook` no painel da sua aplicação Meta.

## Antes de enviar DMs reais

Mantenha `DRY_RUN=true` até concluir o App Review e confirmar o endpoint correto no onboarding que sua conta utiliza. Configure as permissões de comentários e mensagens exigidas pela Meta e implemente `deliverPrivateReply` com o endpoint indicado na documentação atual. A API permite respostas privadas a comentários apenas quando a própria Meta autoriza aquela resposta.

Referências: [webhooks do Instagram](https://developers.facebook.com/docs/graph-api/webhooks/reference/instagram), [campos de comentário](https://developers.facebook.com/docs/graph-api/reference/v13.0/comment) e [changelog de mensagens do Instagram](https://developers.facebook.com/documentation/business-messaging/instagram-messaging/changelog/).
