import {useDocument} from "../helpers/doc-type-hooks/useDocument";
import {createDocument} from "../helpers/doc-type-hooks/createDocument";
import {setState} from "../helpers/doc-type-hooks/setState";


export default class Base {

    /**
     * This is the base class that all Appsby Component Types descend from.
     * @class
     * @param {object} connectionParameters - a key/value object of connection parameters, optionally passed in via your front-end.
     * */
    constructor(connectionParameters) {
        this.props = {};
        this.props.connectionParameters = connectionParameters;
        this.state = {};
    }

    /**
     * This is called right after a component is instantiated, and before any of your custom logic executes - just like React. Use this to load documents, or whatever else you need to do.
     * */
    async componentDidMount() {}

    /**
     * This is called after componentDidMount() to check if the execution is authorised. An example use case for this is checking that a user owns a document before they can edit it. Simply return true or false.
     * @return {boolean}
     * */
    async componentShouldAuthorize() {
        return true;
    }

    /**
     * This can be called within componentDidMount() or your own functions (or anywhere actually). Simply specify a documentType, and a documentId or a key/value object containing document qualifiers to locate, and then load a document into the component's state.
     * Once the document has loaded (remember to await!), the document will be available via this.state.
     * @param {string} documentType - this is the type for the document. If it doesn't exist, it'll be auto-generated. This might be 'user', or 'members', or something similar.
     * @param {string/object} documentIdOrQualifiers - this is where you specify how to retrieve the user. If the users input their own unique ID, put their ID here as a string. Otherwise, you might find them via another method, such as a unique email address saved in their user document. You'd do this by passing an object with syntax like { emailAddress: "demo@example.com" }.
     * @param {boolean} shouldAutoSave - if you make any changes to your component's state, you can turn on auto-save to automatically update the document once your function ends.
     * */
    async useDocument(documentType, documentIdOrQualifiers, shouldAutoSave = false){
        await useDocument(this, documentType, documentIdOrQualifiers, shouldAutoSave);
    }

    /**
     * You can use this function anywhere to create a new document, with a type you specify and any data you want to add to it. If the document type does not exist in the database yet, it will be auto-generated.
     * @param {string} documentType - this is the type for the document. If it doesn't exist, it'll be auto-generated.
     * @param {object} data - the initial data you want to set within your document. Documents are typical NoSQL JSON format. You can read more about what can be stored within documents and how they work at Fauna.com.
     * */
    async createDocument(documentType, data) {
        return await createDocument(documentType, data);
    }

    /**
     * After you've loaded a document via useDocument(), you can use this function to update the document immediately, without having to use auto-save. This is great for when you need to update multiple different documents in a single function.
     * @param {object} data - this will update your document immediately with your new values, and reload the document into this.state once the update is completed.
     * */
    async setState(data) {
        return await setState(this, data)
    }

}
