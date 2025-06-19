# Costera - Your AI Office Assistant

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fslugs%2Fnatural-language-sql&env=POSTGRES_URL,POSTGRES_URL_NON_POOLING,POSTGRES_PRISMA_URL,POSTGRES_USER,POSTGRES_HOST,POSTGRES_PASSWORD,POSTGRES_DATABASE&envDescription=Get%20these%20credentials%20from%20Vercel%20Postgres&envLink=https%3A%2F%2Fvercel.com%2Fdocs%2Fstorage%2Fvercel-postgres%2Fconnecting%23get-the-credentials&project-name=costera-sql-database-assistant&repository-name=costera-sql-database-assistant&demo-title=Costera%20-%20SQL%20Database%20Assistant&demo-description=Chat%20with%20your%20SQL%20database%20using%20natural%20language%20powered%20by%20Costera.&demo-url=https%3A%2F%2Fcostera&stores=%5B%7B%22type%22%3A%22postgres%22%7D%5D)

Costera is your intelligent office assistant that transforms how your entire team works with business data. Beyond just database queries, Costera helps with strategic insights, team collaboration, and informed decision-making - all through natural conversation. No more technical barriers between your business questions and actionable answers.

## Getting Started

Costera requires minimal setup to start transforming how your office interacts with data:

### 1. Set Up Your Database

The first step is to set up your PostgreSQL database. We recommend using [Vercel Postgres](https://vercel.com/storage/postgres).

After creating your database, you'll need to get the connection string. You can find this in your Vercel project dashboard under the "Storage" tab.

### 2. Configure Environment Variables

Create a `.env.local` file in the root of your project and add your database connection string:

```bash
POSTGRES_URL="your-postgres-connection-string"
```

### 3. Install Dependencies

Install the necessary dependencies using `pnpm`:

```bash
pnpm install
```

### 4. Run the Application

Now, you can run the development server:

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to start your conversation with Costera!

## Deploy Costera For Your Entire Team

Give everyone in your office access to Costera by deploying it with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fslugs%2Fnatural-language-sql&env=POSTGRES_URL,POSTGRES_URL_NON_POOLING,POSTGRES_PRISMA_URL,POSTGRES_USER,POSTGRES_HOST,POSTGRES_PASSWORD,POSTGRES_DATABASE&envDescription=Get%20these%20credentials%20from%20Vercel%20Postgres&envLink=https%3A%2F%2Fvercel.com%2Fdocs%2Fstorage%2Fvercel-postgres%2Fconnecting%23get-the-credentials&project-name=costera-sql-database-assistant&repository-name=costera-sql-database-assistant&demo-title=Costera%20-%20SQL%20Database%20Assistant&demo-description=Chat%20with%20your%20SQL%20database%20using%20natural%20language%20powered%20by%20Costera.&demo-url=https%3A%2F%2Fcostera&stores=%5B%7B%22type%22%3A%22postgres%22%7D%5D)

## The Technology Behind Costera

Costera is built on cutting-edge technology:

-   **Next.js:** A powerful React framework for building fast and scalable web applications.
-   **Vercel AI SDK:** A library for building AI-powered applications with React and Next.js.
-   **Vercel Postgres:** A serverless PostgreSQL database designed for the modern web.

This project is a fork of the [Vercel AI SDK Postgres-Next.js Template](https://github.com/vercel/ai/tree/main/examples/next-postgres).
