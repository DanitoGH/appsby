import faunadb from "faunadb";

export async function CreateClient() {
    return new faunadb.Client({ secret: process.env.faunaSecret });
}
