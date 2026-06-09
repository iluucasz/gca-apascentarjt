# GCA — Sistema de Acompanhamento Pastoral

**Grupo de Crescimento Apascentar** · Ministério Apascentar Jardim Tropical

> Sistema de cuidado pastoral e acompanhamento de grupos, para que nenhuma
> ovelha fique sem atenção e nenhum líder carregue o peso sozinho. 🐑

Aplicação em **Next.js** com dados salvos **no próprio navegador** (localStorage,
persistente entre sessões, sem necessidade de servidor).

## Como rodar

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

Para gerar a versão de produção:

```bash
npm run build
npm start
```

## Acessos de demonstração (PIN)

| Usuário                | Perfil       | PIN  | Vê                                   |
| ---------------------- | ------------ | ---- | ------------------------------------ |
| Pr. Marcos             | Supervisor   | 1234 | Tudo: todos os grupos e relatórios   |
| João Silva             | Líder        | 1111 | Apenas o GCA Jardim Tropical         |
| Ana Souza              | Auxiliar     | 2222 | Grupo dele, sem relatórios sensíveis |
| Paulo Lima             | Líder        | 3333 | Apenas o GCA Betel                   |

> Os PINs ficam no código de exemplo (`src/lib/seed.ts`). Em uso real, altere-os.

## Perfis de acesso

- **Supervisor / Admin** — vê todos os grupos, pessoas, frequência e relatórios.
- **Líder** — vê apenas o seu grupo, seus membros e os relatórios dele.
- **Auxiliar** — acesso limitado ao seu grupo (presença e cadastro básico);
  **não** vê as observações pastorais dos relatórios.

## Módulos

1. **Painel Geral** — métricas, alertas prioritários, situação das pessoas e
   saúde dos grupos.
2. **Pessoas** — ficha completa (dados pessoais, família, situação) + **árvore
   familiar** (ex.: Família Silva).
3. **Grupos / GCAs** — líder, auxiliar, anfitrião, endereço, horário, situação.
4. **Frequência** — chamada por reunião: presentes, ausentes, motivo, visitantes,
   quem precisa de ligação/visita.
5. **Relatório Espiritual** — formulário mensal por pessoa, com **controle de
   privacidade** (líder do grupo / somente supervisor).
6. **Alertas automáticos** — faltou 3× seguidas, grupo sobrecarregado, grupo
   diminuindo, família nova, cuidado urgente.

## Estrutura do projeto

```
src/
  app/
    login/            → tela de login por PIN
    (app)/
      layout.tsx      → navegação + proteção de rota
      painel/ pessoas/ grupos/ frequencia/ relatorios/ alertas/
  components/         → UI reutilizável (cartões, modal, badges, alertas)
  lib/
    types.ts          → modelo de dados
    store.tsx         → estado + persistência em localStorage
    seed.ts           → dados de exemplo
    acl.ts            → regras de acesso por perfil
    alertas.ts        → motor de alertas
    utils.ts          → datas, idade, WhatsApp, etc.
```

## Dados

Tudo é salvo no navegador (chave `gca:db:v1`). O Supervisor pode **restaurar os
dados de exemplo** pelo botão no rodapé do Painel.
