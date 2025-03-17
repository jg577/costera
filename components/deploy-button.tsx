export const DeployButton = () => (
  <a
    href={`https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fnatural-language-postgres&env=OPENAI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fnatural-language-postgres%2Fblob%2Fmain%2F.env.example&demo-title=Luna%20-%20SQL%20Database%20Assistant&demo-description=Chat%20with%20your%20SQL%20database%20using%20natural%20language%20powered%20by%20Luna.&demo-url=https%3A%2F%2Fluna&stores=%5B%7B%22type%22%3A%22postgres%22%7D%5D`}
    target="_blank"
  >
    <img src="https://vercel.com/button" alt="Deploy with Vercel" />
  </a>
);