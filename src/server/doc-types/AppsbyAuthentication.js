import {AppsbyGetSingleDocument} from "..";
import Base from "./Base";

/** Create an instance of AppsbyAuthentication to authenticate users (both on initial login and subsequently). */
export class AppsbyAuthentication extends Base {

    /**
     * This is called from the front-end to determine if a user can log in. The login attributes specified in the front-end (usually username/password/etc) will be available via this.props.connectionParameters.
     * You can then use these, in combination with useUser() to check if a user can login or not.
     * @return {boolean} return either true or false to log a user in, or deny them.
     */
    async login() { throw new Error(`login() has not yet been implemented in this component. This component has no functionality until it is implemented.`) }

    /**
     * This loads a document as an application's user. If the user exists in the database (and has been found with the documentIdOrQualifiers you specify), they will be available via this.props.user.
     * @param {string} documentType - this is the type for the user document. If it doesn't exist, it'll be auto-generated. This might be 'user', or 'members', or something similar.
     * @param {string/object} documentIdOrQualifiers - this is where you specify how to retrieve the user. If the users input their own unique ID, put their ID here as a string. Otherwise, you might find them via another method, such as a unique email address saved in their user document. You'd do this by passing an object with syntax like { emailAddress: "demo@example.com" }.
     */
    async useUser(documentType, documentIdOrQualifiers){

        let doc = await AppsbyGetSingleDocument(documentType, this.injectedIDForUseDocumentOnAuth ? this.injectedIDForUseDocumentOnAuth : documentIdOrQualifiers);

        if (doc) {
            this.state = doc.document;
            this.props.documentId = doc.documentId;
            this.props.userId = doc.documentId;
            this.props.user = doc.document;
            this.props.documentType = doc.documentType
            this.props.faunaDocumentRef = doc.faunaDocumentRef;
            this.props.autoSave = false;
        } else {
            throw new Error("[401] Login failed. Check if you've used the right email address.")
        }
    }

}
