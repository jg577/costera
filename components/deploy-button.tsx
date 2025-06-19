import { VercelLogo } from './icons'

export function DeployButton() {
  return (
    <a
      className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
      href={`https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fslugs%2Fnatural-language-sql&env=POSTGRES_URL,POSTGRES_URL_NON_POOLING,POSTGRES_PRISMA_URL,POSTGRES_USER,POSTGRES_HOST,POSTGRES_PASSWORD,POSTGRES_DATABASE&envDescription=Get%20these%20credentials%20from%20Vercel%20Postgres&envLink=https%3A%2F%2Fvercel.com%2Fdocs%2Fstorage%2Fvercel-postgres%2Fconnecting%23get-the-credentials&project-name=costera-sql-database-assistant&repository-name=costera-sql-database-assistant&demo-title=Costera%20-%20SQL%20Database%20Assistant&demo-description=Chat%20with%20your%20SQL%20database%20using%20natural%20language%20powered%20by%20Costera.&demo-url=https%3A%2F%2Fcostera&stores=%5B%7B%22type%22%3A%22postgres%22%7D%5D`}
      target="_blank"
      rel="noreferrer"
    >
      <VercelLogo className="size-4" />
      Deploy to Vercel
    </a>
  )
}