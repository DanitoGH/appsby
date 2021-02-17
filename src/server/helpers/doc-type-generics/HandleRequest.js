import {performAuthentication} from "../../handlers/handle-auth";
import {IsObjectEmpty} from "../string-normalizers";
import {createReturnObject} from "../createReturnObject";
import {setState} from "../doc-type-hooks/setState";
import {PrepareDoc} from "./PrepareDoc";

export async function HandleRequest(ViewInterpreter, headers, deviceId, connectionParameters, rawData) {

    const { view, identifiedUser } = await PrepareDoc(ViewInterpreter, headers, deviceId, connectionParameters)

    if (identifiedUser && await view.componentShouldAuthorize()) {

        if (!rawData || IsObjectEmpty(rawData)) {
            if (view.render) {
                return createReturnObject(identifiedUser, await view.render());
            }
        }

        const [key, value] = Object.entries(rawData)[0];
        const formattedData = await view[key](value);

        if (view.props.userHasReauthenticated) {
            return formattedData;
        }

        if (view.props.autoSave) {
            await setState(view, formattedData);
        }

        if (view.render)
        {
            return createReturnObject(identifiedUser, await view.render());
        } else {
            return createReturnObject(identifiedUser, formattedData);
        }

    } else if (identifiedUser) {
        //user was identified but didn't have access
        return createReturnObject(identifiedUser, {});
    } else {
        throw new Error("[401] Unauthorized");
    }
}
