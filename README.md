# 🤖 SAMI

🧪 Game where users have to chat and discover who is the AI agent, which disguises as a human on every game. Over time, the adaptive AI aims to be unrecognizable.

⚙️ Built using Typescript, Eliza, NextJS, Express, Supabase, RainbowKit, Foundry, Wagmi and Viem.

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.18)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)


## Start with Docker

1. Clone this repo:

```
git clone https://github.com/fabian416/sami.git
cd sami
```

2. Duplicate the .env.example template from the ROOT and fill the variable PRIVATE_KEY and OPENAI_API_KEY with your own keys

```bash
cp .env.example .env
```
PRIVATE_KEY= #Your private key
OPENAI_API_KEY=sk-* # OpenAI API key, starting with sk-

3. Start docker

```bash
docker compose up -d
```

4. Enter to http://localhost:3001 and play with sami!


## Architecture

- Frontend homepage at `packages/nextjs/app/page.tsx`.
- Backend in `packages/backend`
- AI in `packages/ai/sami`
- Smart contracts in `packages/foundry/contracts`
- Deployment scripts in `packages/foundry/script`
