import remove from 'confusables';

function isValidUsername(v) {
    if (!v) return false;
    var re = /^[a-zA-Z0-9]+$/;
    return re.test(v);
}

export function AppsbyNormalizeUserHandle(username) {
    username = remove(username);
    username = username.toLowerCase();
    if (!username.match(/([a-z0-9]+(-[A-z0-9]+)?)/)) return false;
    if (SPECIAL_HOSTNAMES.includes(username)) return false;
    if (PROTOCOL_HOSTNAMES.includes(username)) return false;
    if (CA_ADDRESSES.includes(username)) return false;
    if (RFC_2142.includes(username)) return false;
    if (NOREPLY_ADDRESSES.includes(username)) return false;
    if (SENSITIVE_FILENAMES.includes(username)) return false;
    if (OTHER_SENSITIVE_NAMES.includes(username)) return false;
    if (isValidUsername(username)) return username;
    return false;
}


let SPECIAL_HOSTNAMES = [
    "autoconfig",
    "autodiscover",
    "broadcasthost",
    "isatap",
    "localdomain",
    "localhost",
    "wpad",
]


let PROTOCOL_HOSTNAMES = [
    "ftp",
    "imap",
    "mail",
    "news",
    "pop",
    "pop3",
    "smtp",
    "usenet",
    "uucp",
    "webmail",
    "www",
]


let CA_ADDRESSES = [
    "admin",
    "administrator",
    "hostmaster",
    "info",
    "is",
    "it",
    "mis",
    "postmaster",
    "root",
    "ssladmin",
    "ssladministrator",
    "sslwebmaster",
    "sysadmin",
    "webmaster",
]


let RFC_2142 = [
    "abuse",
    "marketing",
    "noc",
    "sales",
    "security",
    "support",
]


let NOREPLY_ADDRESSES = [
    "mailer-daemon",
    "nobody",
    "noreply",
    "no-reply",
]


let SENSITIVE_FILENAMES = [
    "clientaccesspolicy.xml",
    "crossdomain.xml",
    "favicon.ico",
    "humans.txt",
    "keybase.txt",
    "robots.txt",
    ".htaccess",
    ".htpasswd",
]


let OTHER_SENSITIVE_NAMES = [
    "account",
    "accounts",
    "auth",
    "authorize",
    "blog",
    "buy",
    "cart",
    "clients",
    "contact",
    "contactus",
    "contact-us",
    "copyright",
    "dashboard",
    "doc",
    "docs",
    "download",
    "downloads",
    "enquiry",
    "faq",
    "help",
    "inquiry",
    "license",
    "login",
    "logout",
    "me",
    "myaccount",
    "oauth",
    "pay",
    "payment",
    "payments",
    "plans",
    "portfolio",
    "preferences",
    "pricing",
    "privacy",
    "profile",
    "register",
    "secure",
    "settings",
    "signin",
    "signup",
    "ssl",
    "status",
    "store",
    "subscribe",
    "terms",
    "tos",
    "user",
    "users",
    "weblog",
    "work",
]

export function ThrowString(variable){
    if (typeof variable !== "string") throw new Error("[500] Type violation.");
}

export function ThrowBoolean(variable){
    if (typeof variable !== "boolean") throw new Error("[500] Type violation.");
}

export function ThrowNumber(variable){
    if (typeof variable !== "number") throw new Error("[500] Type violation.");
}

export function ThrowObject(variable){
    if (typeof variable !== "object") throw new Error("[500] Type violation.");
}

export function ThrowSymbol(variable){
    if (typeof variable !== "symbol") throw new Error("[500] Type violation.");
}

export function ThrowBigInt(variable){
    if (typeof variable !== "bigint") throw new Error("[500] Type violation.");
}

export function ThrowFunction(variable){
    if (typeof variable !== "function") throw new Error("[500] Type violation.");
}

export function ThrowUndefined(variable){
    if (typeof variable !== "undefined") throw new Error("[500] Type violation.");
}

export function IsObjectEmpty(object) {
    for(var prop in object) {
        if(object.hasOwnProperty(prop))
            return false;
    }

    return true;
}
