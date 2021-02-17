import {SetDocument} from "../SetDocument";
import {FaunaDocToAppsbyDoc} from "../fauna/FaunaDocToAppsbyDoc";

export async function setState(_this, data) {

    let y = await SetDocument(_this.props.faunaDocumentRef, data, _this.state);
    let x = { data: y };
    _this.state = FaunaDocToAppsbyDoc(x).document;
}
