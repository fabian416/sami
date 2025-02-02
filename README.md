# 🤖 SAMI

🧪 Game where users have to chat and discover who is the AI agent, which disguises as a human on every game. Over time, the adaptive AI aims to be unrecognizable.

⚙️ Built using Typescript, Eliza, NextJS, Express, Supabase, RainbowKit, Foundry, Wagmi and Viem.

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.18)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started with SAMI, follow the steps below:

1. Clone this repo and install dependencies:

```
git clone https://github.com/fabian416/sami.git
cd sami
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Foundry. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/foundry/foundry.toml`.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is located in `packages/foundry/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/foundry/script` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start your backend by running first:

```
yarn backend:build
```

And then running:

```
yarn backend:dev
```

5. On a fourth terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

Run smart contract test with `yarn foundry:test`

## Architecture

- Frontend homepage at `packages/nextjs/app/page.tsx`.
- Backend in `packages/backend`
- AI in `packages/ai/sami`
- Smart contracts in `packages/foundry/contracts`
- Deployment scripts in `packages/foundry/script`
