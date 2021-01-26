<p align="center">
  <a href="http://www.audallabs.com">
    <img alt="Audal Labs Logo" src="https://static.audallabs.com/logodark.png" width="90" />
  </a>
</p>

<h1 align="center">Appsby</h1>

<h4 align="center">Full-stack, server-less apps that are fast to build ⏰ and run everywhere 🏃‍.</h4>

<pre align="center">npm i appsby</pre>

#### Why build this?
- Building Lambdas for JAMStack apps can feel archaic when you're used to using beautiful, declarative tools everywhere else. 
- Traditional Node frameworks like Express aren't built for Lambda environments, and don't include cloud functionality out of the box.
- Using Netlify or Vercel to create any non-trivial backend currently requires a stupid amount of time and a tonne of your own tooling.
- Serverless Framework is great to build with, but introduces a lot of extra complexity.
- Give startups and small orgs a framework that's fast to execute, and faster to build with than anything currently available.

#### What can I do with this?
- Build your Lambda-based NodeJS back-end fast
- Build your front-end fast (and with any framework)
- Avoid dealing with databases
- Avoid the expenses of Firebase or AppSync
- Avoid implementing typical boilerplate

#### What does it do?
- Replaces ExpressJS and other similar frameworks for server-less Lambda-based environments
- Gives you a super simple way to implement common app features (auth, views, apis, search, file upload/download)
- Automatically implements your database from your code, using Fauna Cloud NoSQL DB as your backing store
- Takes care of requests, caching, invalidation on the front-end (you can probably ditch your Global State Manager)

#### How do I do it?
- ES6 Classes that work like React Components, plus a few lines in your Lambda Function Handler
- Use the in-built front-end functions to handle your requests
- Deploy to any Lambda-based Cloud Provider (AWS, Serverless.com, Netlify, Vercel, probably more)


#### I use GCP/Cloudflare/other function provider...
- Appsby doesn’t use any tech specific to AWS, but it expects requests to be delivered in AWS Lambda Format
- You’ll need to build a function to remap your function provider’s request object to AWS Lambda format
- File operations are locked to S3 format. Feel free to use any provider that uses an S3-style API.

#### Deciding between AWS/Serverless.com and Netlify/Vercel:
- Appsby can optionally use S3 bucket triggers for running your code
- This is usually done post-upload if you have some data crunching to do
- Netlify/Vercel don’t give you ability to trigger functions in this manner
- There is a client-triggered event that will run post-upload, so many workflows won’t need this

#### Roadmap to v1:
- Slim down the dependency list to only essentials
- Reduce package size further
- Refactors for tidying
- Starter projects for Gatsby, Next and Serverless as API
- Write guides

#### Acknowledgements:
Dicky Suryadi / DotNetify: This project draws substantial inspiration from Dicky's fantastic ASP.NET package, especially the view creation and state hydration system.

<h3 align="center">Things you'll need...</h3>

- FaunaDB account, with a new database and an API key
- AWS access/secret keys for managing S3 file operations
- SMTP mail account, if you want to use built in Nodemailer
- Some sort of infra that can run Lambdas
- A .babelrc that transpiles your ES6+ code
