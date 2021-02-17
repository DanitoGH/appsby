export function createReturnObject(identifiedUser, view) {
    var returnObject = { token: null, data: null };
    if (typeof identifiedUser === "object"){
        returnObject.token = identifiedUser.jwt;
    }
    returnObject.data = view;
    return returnObject;
}
