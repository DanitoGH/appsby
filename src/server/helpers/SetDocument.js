import { query as q } from 'faunadb';
import {CreateClient} from "./fauna/CreateClient";

function transformArray(newData, oldData) {
    if (Array.isArray(oldData)){
        if (Array.isArray(newData)){

            let oldKeyMatches = [];
            let newKeyNonMatches = [];

            for (let i = 0; i < newData.length; i++){
                Object.keys(newData[i]).forEach((e) => {
                    if (oldData[i]) {
                        oldKeyMatches.push(e)
                    } else {
                        newKeyNonMatches.push(e)
                    }
                })
            }

            //remove duplicates
            oldKeyMatches = [...new Set(oldKeyMatches)];
            newKeyNonMatches = [...new Set(newKeyNonMatches)];

            if (oldKeyMatches.includes("id")){

                let existingIds = [];
                let newIds = [];

                newData.forEach((newitem) => {
                    if (oldData.find(x => x.id === newitem.id)) { existingIds.push(newitem.id); } else { newIds.push(newitem.id) }
                })

                existingIds.forEach((existingId) => {
                    let newitem = newData.find(x => x.id === existingId);
                    let olditem = oldData.find(x => x.id === existingId);
                    boo2(newitem, olditem);
                });

                newIds.forEach((newId) => {
                    let newitem = newData.find(x => x.id === newId);
                    oldData.push(newitem);
                })

            } else {
                oldKeyMatches.forEach((matchedKey) => {
                    boo2(newData[matchedKey], oldData[matchedKey]);
                })
                newKeyNonMatches.forEach((unmatchedKey) => {
                    oldData[unmatchedKey] = newData[unmatchedKey];
                })
            }

        } else { //making update to single object
            boo2(newData, oldData);
        }
    } else if (typeof oldData === "object") { //this is a single object, merge values, but still need to check for objects/arrays and recurse
        boo2(newData, oldData);
    } else { // we're just replacing the values then
        oldData = newData;
    }
}

function boo2 (newDataKey, oldDataKey){

    Object.keys(newDataKey).forEach((newKey) => {

        if (newKey.includes("_&removeFromArray")){
            let keyName = newKey.replace("_&removeFromArray", "")
            if (Array.isArray(oldDataKey[keyName])){

                if (!Array.isArray(newDataKey[newKey])){
                    newDataKey[newKey] = [newDataKey[newKey]];
                }

                newDataKey[newKey].forEach((newitem, indexa) => {
                    oldDataKey[keyName].forEach((olditem, indexb) => {
                        if (olditem.id && newitem.id) {
                            if (olditem.id === newitem.id) {
                                oldDataKey[keyName].splice(indexb, 1);
                            }
                        }
                    })
                })


            } else {
                delete oldDataKey[keyName];
            }

        } else if (newKey.includes("_&replace")) {
            let keyName = newKey.replace("_&replace", "")
            oldDataKey[keyName] = newDataKey[newKey];
        }  else {

            if (typeof newDataKey[newKey] === "object" && typeof oldDataKey[newKey] === "object") {
                if (Array.isArray(oldDataKey[newKey]) && !Array.isArray(newDataKey[newKey])) { //the old key was an array, the new key is a single object
                    if (newDataKey[newKey].id) { // if the new data (as a single object) still contains an id, treat it like it should be in an array
                        if (oldDataKey[newKey].find(x => x.id === newDataKey[newKey].id)) { // found an object with the same id, do a normal merge
                            boo2([newDataKey[newKey]], oldDataKey[newKey])
                        } else {
                            oldDataKey[newKey].push(newDataKey[newKey]);
                        }
                    } else {
                        oldDataKey[newKey] = newDataKey[newKey];
                    }
                } else {
                    transformArray(newDataKey[newKey], oldDataKey[newKey])
                }
            } else {
                if (newKey === "id") {
                    // do nothing, we don't want to replace any id
                } else {
                    oldDataKey[newKey] = newDataKey[newKey];
                }

            }
        }
    })
}

export async function SetDocument(reference, data, existing = null, shouldSave = true) {
    if (data === null || data === undefined) { data = {} }
    const client = await CreateClient()
    Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
    const metadata = {};
    Object.keys(data).forEach((key) => { if (key[0] === '*') { metadata[key] = data[key]; delete data[key]}});
    let existingDocSchema;
    if (existing) {
        existingDocSchema = {};
        existingDocSchema.data = existing;
    } else {
        existingDocSchema = await client.query(q.Get(reference));
    }
    transformArray(data, existingDocSchema.data);
    Object.keys(existingDocSchema.data).forEach((key) => { if (key[0] === '*') { console.log("remove some fucking stars"); delete existingDocSchema.data[key]}});
    console.log(existingDocSchema.data);
    data = existingDocSchema.data;
    let t = existingDocSchema;
    if (shouldSave) {
        t = await client.query(q.Replace(reference, { data }));
    }
    Object.keys(metadata).forEach((key) => t.data[key.substring(1)] = metadata[key]);
    return t;
}
