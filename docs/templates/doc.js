import { graphql } from 'gatsby'
import React from 'react'

export const pageQuery = graphql`
    query DocPageQuery($id: String!) {
        allDocumentationJs(filter: {id: {eq: $id}}) {
            nodes {
                id
                description {
                    internal {
                        content
                    }
                }
                name
                memberof
                kind
                childrenDocumentationJs {
                    id
                    description {
                        internal {
                            content
                        }
                    }
                    name
                }
            }
        }
    }
`

export default function Page(props) {

    let data = props.data.allDocumentationJs.nodes[0];

    return <>
        <h2>{data.name}</h2>
        <h4>Member of {data.memberof}</h4>
        <h6>{data.kind}</h6>
        <p>{data.description.internal.content}</p>
        {data.childrenDocumentationJs.map((item) => (
            <div>
                <div>{item.name}</div>
                <div>{item.description.internal.content}</div>
            </div>
        ))}
    </>
}
