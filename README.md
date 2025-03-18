# Luna - Your AI Office Assistant

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fnatural-language-postgres&env=OPENAI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fnatural-language-postgres%2Fblob%2Fmain%2F.env.example&demo-title=Luna%20-%20SQL%20Database%20Assistant&demo-description=Chat%20with%20your%20SQL%20database%20using%20natural%20language%20powered%20by%20Luna.&demo-url=https%3A%2F%2Fluna&stores=%5B%7B%22type%22%3A%22postgres%22%7D%5D)

## More Than Just SQL - Your Complete Office Companion

Luna is your intelligent office assistant that transforms how your entire team works with business data. Beyond just database queries, Luna helps with strategic insights, team collaboration, and informed decision-making - all through natural conversation. No more technical barriers between your business questions and actionable answers.

## What Can Luna Do For Your Office?

- **Understand Business Questions**: Ask anything like "How did our Chicago location perform last quarter?" or "What product categories have the highest profit margin?" in plain language.

- **Generate Presentation-Ready Visuals**: Luna automatically creates beautiful charts, tables, and data summaries that can be shared directly with stakeholders or incorporated into reports.

- **Deliver Strategic Insights**: Luna doesn't just fetch data - it analyzes trends, identifies opportunities, and highlights potential issues that might impact your business.

- **Enable Team Collaboration**: Everyone in your office can access the same data insights without technical knowledge, democratizing information across departments.

- **Build Institutional Knowledge**: Luna maintains historical queries and insights, creating a searchable knowledge base of business intelligence specific to your organization.

- **Streamline Decision Making**: Make data-informed decisions faster by reducing the time between questions and actionable insights.

## Perfect For Your Entire Office

- **Executives** who need quick answers to strategic questions
- **Marketing Teams** analyzing campaign performance and customer behavior
- **Operations Managers** monitoring efficiency and identifying bottlenecks
- **Sales Teams** tracking performance and identifying opportunities
- **Finance Departments** generating reports and analyzing cost structures
- **HR Teams** understanding staffing patterns and productivity metrics
- **Anyone in your organization** who needs data without technical barriers

## Daily Office Tasks Luna Makes Easier

- **Morning Briefings**: "What are today's key metrics to watch?"
- **Team Meetings**: "Show me how each department performed this month"
- **Quarterly Reviews**: "Compare our performance to previous quarters"
- **Decision Support**: "What would happen to our margins if we raised prices by 5%?"
- **Trend Spotting**: "Are there any unusual patterns in our customer behavior lately?"
- **Quick Fact Checks**: "What was our highest selling product last week?"

## How Luna Works Its Magic

1. **You ask** a business question in plain English
2. **Luna translates** your question into optimized database queries
3. **Results appear** in easy-to-read tables and professionally designed charts
4. **Strategic insights** are generated to highlight important patterns and opportunities
5. **Your team collaborates** by asking follow-up questions and exploring the data together

## Key Office Assistant Features

- **Intelligent Conversation**: Luna understands context and business terminology across departments.
- **Beautiful Visualizations**: Automatically generates presentation-ready charts with distinct colors for clear data representation.
- **Multi-Data Integration**: For complex business questions, Luna can integrate data from multiple sources.
- **Time-Series Analysis**: Historical data is always properly organized and analyzed for trends over time.
- **Business-Ready Formatting**: Currencies, percentages, metrics, and dates are displayed in professional formats.
- **Transparency**: Always see how Luna arrived at its conclusions with full visibility into the underlying queries.
- **Infinite Conversation History**: Keep a record of all queries and insights, building a knowledge base over time.

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
- **Advanced AI** powered by OpenAI for natural language understanding
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
