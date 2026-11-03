// Onde as atualizações são publicadas. Valores fixos de configuração — o
// TOKEN nunca fica aqui (nem em nenhum arquivo do repositório): cada pessoa
// cria o próprio e o digita na tela "Atualizar dados" (ver README).

export interface GithubConfig {
  apiBase: string
  owner: string
  repo: string
  branch: string
  /** Pasta append-only das atualizações (cada publicação cria UM arquivo novo aqui). */
  updatesDir: string
}

export const GITHUB_CONFIG: GithubConfig = {
  apiBase: 'https://api.github.com',
  owner: 'DjeisonCantu',
  repo: 'pneustore-black-friday-dashboard',
  branch: 'main',
  updatesDir: 'data/updates',
}

export const TOKEN_HELP_URL = 'https://github.com/settings/personal-access-tokens/new'
