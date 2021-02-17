export function GetTerms(fieldsToQualify) {
    var sortTermsNicelyForCrankyFauna;

    if (typeof fieldsToQualify === "string"){
        return fieldsToQualify
    }

    if (Object.keys(fieldsToQualify).length === 1) {
        Object.keys(fieldsToQualify).forEach((field) => {
            sortTermsNicelyForCrankyFauna = fieldsToQualify[field];
        })

    } else {
        sortTermsNicelyForCrankyFauna = [];
        Object.keys(fieldsToQualify).forEach((field) => {
            var fieldItem = fieldsToQualify[field];
            sortTermsNicelyForCrankyFauna.push(fieldItem)
        })
    }

    return sortTermsNicelyForCrankyFauna;
}
