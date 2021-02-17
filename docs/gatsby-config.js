module.exports = {
  plugins: [
    `gatsby-transformer-documentationjs`,
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'source',
        path: `${__dirname}/../src/server/`,
      },
    },
    {
      resolve: `gatsby-plugin-google-fonts`,
      options: {
        fonts: [
          `inter\:100,200,300,400,500,600,700,800,900` // you can also specify font weights and styles
        ],
        display: 'swap'
      }
    }
  ],
};
/*
{
      resolve: "smooth-doc",
      options: {
        name: "Appsby.js",
        description: "A batteries-included full-stack JS framework for your Gatsby project.",
        siteUrl: "https://appsby.github.io",
        author: 'Audal Labs',
        navItems: [{ title: 'Docs', url: '/docs/' }],
        githubRepositoryURL: 'https://github.com/audal/appsby/',
        sections: ['Guides', 'Components', 'Reference']
      },
    },
 */
