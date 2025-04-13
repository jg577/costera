# Luna - Your AI Office Assistant

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fnatural-language-postgres&env=OPENAI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fnatural-language-postgres%2Fblob%2Fmain%2F.env.example&demo-title=Luna%20-%20SQL%20Database%20Assistant&demo-description=Chat%20with%20your%20SQL%20database%20using%20natural%20language%20powered%20by%20Luna.&demo-url=https%3A%2F%2Fluna&stores=%5B%7B%22type%22%3A%22postgres%22%7D%5D)

## More Than Just SQL - Your Complete Office Companion

Luna is your intelligent office assistant that transforms how your entire team works with business data. Beyond just database queries, Luna helps with strategic insights, team collaboration, and informed decision-making - all through natural conversation. No more technical barriers between your business questions and actionable answers.


## Getting Started

Luna requires minimal setup to start transforming how your office interacts with data:

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up your environment variables:
   ```bash
   cp .env.example .env
   ```
   
3. Add your OpenAI API key and database connection details to the `.env` file.

4. Seed your database with sample data:
   ```bash
   pnpm run seed
   ```

5. Launch Luna:
   ```bash
   pnpm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to start your conversation with Luna!

## Deploy Luna For Your Entire Team

Give everyone in your office access to Luna by deploying it with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fnatural-language-postgres&env=OPENAI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fnatural-language-postgres%2Fblob%2Fmain%2F.env.example&demo-title=Luna%20-%20SQL%20Database%20Assistant&demo-description=Chat%20with%20your%20SQL%20database%20using%20natural%20language%20powered%20by%20Luna.&demo-url=https%3A%2F%2Fluna&stores=%5B%7B%22type%22%3A%22postgres%22%7D%5D)

## The Technology Behind Luna

Luna is built on cutting-edge technology:

- **Next.js** for a responsive, modern interface
- **Advanced AI** powered by OpenAI for NLU
- **Interactive Visualizations** with Recharts
- **SQL Database Integration** with Vercel Postgres
- **Beautiful UI Components** from ShadcnUI and Tailwind CSS
- **Smooth Animations** via Framer Motion

For developers interested in learning more about these technologies:

- [Next.js Documentation](https://nextjs.org/docs)
- [AI SDK](https://sdk.vercel.ai/docs)
- [OpenAI](https://openai.com/)
- [Vercel Postgres powered by Neon](https://vercel.com/docs/storage/vercel-postgres)
- [Framer Motion](https://www.framer.com/motion/)
- [ShadcnUI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts](https://recharts.org/en-US/)
