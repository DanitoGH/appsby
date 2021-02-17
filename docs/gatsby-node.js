const path = require('path');

exports.createPages = async ({ actions, graphql }) => {
    const {createPage, createRedirect} = actions;


    const pageResults = await graphql(`
    query {
  allDocumentationJs {
    edges {
      node {
        id
        kind
        description {
          id
          internal {
            content
          }
        }
        name
        memberof
      }
    }
  }
}
  `);

    pageResults.data.allDocumentationJs.edges.forEach((node) => {

        console.log(node);
        createPage({
            path: node.node.id,
            component: path.resolve(`./templates/doc.js`),
            context: {
                // This is the $slug variable
                // passed to blog-post.js
                id: node.node.id
            }
        });
    })


};
