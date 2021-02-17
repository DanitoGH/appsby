import cachios from 'cachios';
import {AppsbyGlobalState} from "./auth";
import axios from 'axios';

let a = axios.create();


let globTimers = [];

function createRefresh(config) {

    /*setTimeout(function() {
        let cacher = cachios.create(a)
        let x = cacher(config).then(result => {
            createRefresh(config)
        }).catch(error => {
            createRefresh(config)
        });
    }, 10000);*/

}

function autoRefreshData(config) {
    var backoff = new Promise(function(resolve) {
        setTimeout(function() {
            resolve();
        }, 10000 || 1000);
    });

    // Return the promise in which recalls axios to retry the request
    return backoff.then(function() {
        return a(config);
    });
}

function createCustomAxios() {

    a.interceptors.response.use(function axiosSuccessInterceptor(succ) {

        createRefresh(succ.config);

        return succ;

    }, function axiosRetryInterceptor(err) {

        let stat = err.response.status;
        if (stat >= 400 && stat < 500) return Promise.reject(err)

        var config = err.config;

        // If config does not exist or the retry option is not set, reject
        if(!config || !config.retry) return Promise.reject(err);

        // Set the variable for keeping track of the retry count
        config.__retryCount = config.__retryCount || 0;

        // Check if we've maxed out the total number of retries
        if(config.__retryCount >= config.retry) {
            // Reject with the error
            createRefresh(config);
            return Promise.reject(err);
        }

        // Increase the retry count
        config.__retryCount += 1;

        // Create new promise to handle exponential backoff
        var backoff = new Promise(function(resolve) {
            setTimeout(function() {
                resolve();
            }, (config.retryDelay * config.__retryCount) || 1000);
        });

        // Return the promise in which recalls axios to retry the request
        return backoff.then(function() {
            return a(config);
        });
    });

    return a;
}

let instance = createCustomAxios();
let cacher = cachios.create(instance)

export function InvalidateCacheAndCreateNew() {
    a = axios.create();
    instance = createCustomAxios();
    cacher = cachios.create(instance);
}

export async function DeliverRequest(toSend, masterEndpoint, shouldBackgroundRefresh = false, ttlInMinutes = 2, useCacheIfAvailable = true) {

    const config = {
        headers: {
            Authorization: AppsbyGlobalState.getAccessToken(),
            Endpoint: masterEndpoint
        },
        ttl: ttlInMinutes * 60,
        force: !useCacheIfAvailable,
        retry: 10, retryDelay: 1500
    };


    async function RetryStrategy() {



        try {

            return cacher.post(global.baseUrl + "/", toSend, config)
                .then(result => {

                    if (result.status === 200) {
                        if (typeof result.data.token === "string"){
                            AppsbyGlobalState.setAccessToken(result.data.token);
                            if (result.data.reauthenticated) {
                                InvalidateCacheAndCreateNew();
                                AppsbyGlobalState.setState({isAuthenticated: true})
                                global.viewConnectors.forEach((connection) => {
                                    connection.connect();
                                })
                                global.searchConnectors.forEach((connection) => {
                                    connection.connect();
                                })
                            }
                        }
                        return { success: true, result: result.data.data }
                    }
                })
                .catch(result => {

                    if (result.response.status === 401) {
                        AppsbyGlobalState.signOut()
                        return { success: false, result: "Please login again" }
                    } else if (result.response.status === 412){
                        return { success: false, result: "Unable to connect to cross-domain resource." }
                    } else {

                        if (result.response && result.response.data && result.response.data.errorMessage) {
                            return { success: false, result: result.response.data.errorMessage }
                        } else if (result.response && result.response.statusText) {
                            return { success: false, result: result.response.statusText }
                        } else {
                            return { success: false, result: "Your internet connection may be offline. Check it and refresh this page."}
                        }
                    }
                })
        } catch (e) {
            return { success: false, result: "" };
        }
    }

    toSend.deviceId = await AppsbyGlobalState.getDeviceId();

    try {
        return await RetryStrategy();
    } catch (e) {
        return { success: false, result: e }
    }
}


export async function ExternalRequest(method, toSend, endpoint, shouldBackgroundRefresh = false, ttlInMinutes = 2, useCacheIfAvailable = true) {

    const config = {
        ttl: ttlInMinutes * 60,
        force: !useCacheIfAvailable,
        retry: 10, retryDelay: 1500
    };


    async function RetryStrategy() {

        try {

            return cacher[method.toLowerCase()](endpoint, toSend, config)
                .then(result => {
                    if (result.status === 200) {
                        return { success: true, result: result.data }
                    }
                })
                .catch(result => {

                    if (result.response.status === 401) {
                        AppsbyGlobalState.signOut()
                        return { success: false, result: "Unauthorized." }
                    } else {

                        if (result.response && result.response.data && result.response.data) {
                            return { success: false, result: result.response.data }
                        } else {
                            return { success: false, result: "Your internet connection may be offline. Check it and refresh this page."}
                        }
                    }
                })
        } catch (e) {
            return { success: false, result: "" };
        }
    }


    try {
        return await RetryStrategy();
    } catch (e) {
        return { success: false, result: e }
    }
}
