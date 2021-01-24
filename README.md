<p align="center">
  <a href="https://www.gatsbyjs.com">
    <img alt="Gatsby" src="https://www.gatsbyjs.com/Gatsby-Monogram.svg" width="60" />
  </a>
</p>

<h1>Appsby</h1>
<h4>Full-stack, serverless apps with easy, React-style declarative syntax.</h4>
<i>Uses Serverless Framework. Netlify/Vercel Functions support coming soon.</i>
<br/>
<br/>

**Turn your Gatsby site (or since 0.03 any React site) into an easy-to-code and super-scalable full-stack app.** No need to worry about your server, or your database, or your site speed. Includes everything you need to create great apps fast. Very MVVMish.

* Build your client logic with Gatsby/CRA/Next.js/any other React-based front-end
* Build complex server logic just like a React component
* Includes full-text search and smart S3 file handling
* Auth included, or easily build your own
* Deploy front-end wherever. Deploy backend via Serverless Framework. Netlify/Vercel Functions support coming soon.

It's high-performance and high-functionality full-stack with nothing more than the JAMStack.

###Why this project?
Managing clients, servers, and cloud functionality can be complex and fraught with issues for small teams. Code duplication, dead code, a mess of API endpoints and Axios requests - you get the idea.
Plus add in multiple repos, complex build and deploy processes, containerization for no good reason and then your development cycles can feel like trying to stop the Titanic sinking.

Appsby simplifies this. Write your front-end, back-end, and cloud file handling at the same time, in the same project, with almost identical ES6-based syntaxes. Share code between server and client components without writing and deploying private NPM/Bit packages. Have one team, where anyone can work on anything within the app, instead of dedicated front-end and back-end people.

###How does it work?
Almost every app on the planet is a Master/Detail style app, that needs CRUD, file handling, auth, and search. Appsby implements this. Everything else is up to you. If you need things like complex data crunching, do it in WebAssembly and add to server or client as you wish.

###Where do I sign up?
1. `npm -i -g appsby`
2. Signup for FaunaDB, create a database, get your secret key.
3. Sign up for AWS, create an unrestricted IAM profile, get your public/private key pair.
4. Run `appsby bootstrap`. This will place a folder called `server` into your project root.
5. Open the `server` folder's `handler.js` and add your keys. You'll eventually define your server pages in here. It's well-commented, so don't get scared.
6. Open the bootstrapped `serverless.yml` and modify it to accommodate your setup.
7. Exclude `appsby` from your SSR/SSG webpack config. Some packages Appsby relies on use `window` - which breaks most SSR/SSGs. If you're using Gatsby, add Appsby to your Gatsby Config Plugins and this will happen automatically.
8. ???
9. Profit/Maybe just sleep easier.


####Acknowledgements:
Dicky Suryadi / DotNetify: This project draws substantial inspiration from Dicky's fantastic ASP.NET package, especially the view creation and state hydration system.
