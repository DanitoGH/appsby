import {CreateNewUserJWT} from "../handlers/handle-auth";
import Base from "./Base";

/** Create an instance of AppsbyAPI to run API-style operations. */
export class AppsbyAPI extends Base {

    /**
     * Instead of returning a normal API response, re-authenticate the current user (doesn't need to be signed in).
     * This is useful for logging someone in automatically after they complete registration, or for letting an Admin use a user's account (for troubleshooting).
     * @param {string} relatedAuthEndpoint - The endpoint that this type of user would normally use to log in. This will be used on subsequent requests to validate the user and get their account details from the database.
     * @param {string} documentId - The documentId/userId of the user to sign in as.
     * @return {object} returns an object Appsby uses to set user credentials within a cookie.
     */
    async authenticateThisUserAs(relatedAuthEndpoint, documentId) {
        this.props.userHasReauthenticated = true;
        return CreateNewUserJWT(documentId, relatedAuthEndpoint, this.props.deviceId, null)
    }


}
