const _alphabet = '23456789bcdfghjkmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ-_',
    _base = _alphabet.length;

export function shortUrlEncode(num) {

    return num;
};

export function shortUrlEncodeFromRef(ref) {

    var num = ref.value.id;
    return shortUrlEncode(num);
};

export function shortUrlDecode(str) {

    return str;

};
