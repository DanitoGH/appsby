import {performAuthentication} from "../../handlers/handle-auth";
import {ThrowObject} from "../string-normalizers";

export async function PrepareDoc(ViewInterpreter, headers, deviceId, connectionParameters, extraProps = null) {

    const view = await new ViewInterpreter.default(connectionParameters);
    view.props = {};
    view.state = {};
    view.props.connectionParameters = connectionParameters;
    view.props.deviceId = deviceId;

    if (extraProps && typeof extraProps === "object" && !Array.isArray(extraProps)) {
        Object.keys(extraProps).forEach((key) => {
            view.props[key] = extraProps[key]
        })
    }

    const identifiedUser = await performAuthentication(headers, deviceId, view.authenticator);

    if (typeof identifiedUser === "object"){
        view.props.user = identifiedUser.user;
        view.props.userId = identifiedUser.userId;
    }

    await view.componentDidMount();

    return { view: view, identifiedUser: identifiedUser }
}
