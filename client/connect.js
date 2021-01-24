var Axios = require ("axios");
var { AppsbyGlobalState } = require("./auth");

global.viewConnectors = [];
global.searchConnectors = [];

async function Refresh(endpoint, view, connectionParameters, data, errorHandler, isPersistent = false) {

    const config = {
        headers: {
            Authorization: AppsbyGlobalState.getAccessToken()
        }
    };

    let toSend = {};
    toSend.data = data;
    toSend.endpoint = endpoint;
    toSend.connectionParameters = connectionParameters;
    toSend.deviceId = await AppsbyGlobalState.getDeviceId();

    try {
        Axios.post(global.baseUrl + "view/", toSend, config).then(result => {
            if (result.status === 200) {
                if (typeof result.data.token === "string") {
                    AppsbyGlobalState.setAccessToken(result.data.token);
                }
                view.setState(result.data.data);
                if (isPersistent) {
                    try {
                        localStorage.setItem("appsbyPersistent_" + endpoint, JSON.stringify(result.data.data));
                    } catch {}
                }
            }
        }).catch(result => {
            if (result.response.status === 401) {
                AppsbyGlobalState.signOut()
            }else {

                if (result.response && result.response.data && result.response.data.errorMessage) {
                    if (errorHandler) {
                        errorHandler(result.response.data.errorMessage)
                    } else {
                        alert(result.response.data.errorMessage)
                    }
                } else if (result.response && result.response.statusText) {
                    if (errorHandler) {
                        errorHandler(result.response.statusText)
                    } else {
                        alert(result.response.statusText)
                    }
                } else {
                    if (errorHandler) {
                        errorHandler("Your internet connection may be offline. Check it and refresh this page.")
                    } else {
                        alert("Your internet connection may be offline. Check it and refresh this page.")
                    }
                }
            }
        });
    } catch (e) {
        if (errorHandler) {
            errorHandler(e)
        } else {
            alert(e)
        }
    }

}

export function AppsbyViewConnection(endpoint, view, connectionParameters, errorHandler, isPersistent, requiresAuth){
  this.view = view;
  this.endpoint = endpoint;
  this.connectionParameters = connectionParameters;
  this.errorHandler = errorHandler;
  this.isPersistent = isPersistent;
  this.requiresAuth = requiresAuth;
  const _this = this;
  this.connect = () => {
    Refresh(_this.endpoint, _this.view, _this.connectionParameters, null, _this.errorHandler, _this.isPersistent)
  };
  this.dispatch = (event) => {
    //_this.view.setState(event)
    Refresh(_this.endpoint, _this.view, _this.connectionParameters, event, _this.errorHandler, _this.isPersistent)
  };
  this.destroy = () => {

  }
  if (this.isPersistent) {
      if (window.localStorage.getItem("appsbyPersistent_" + endpoint) !== null){
          try {
              let oldState = JSON.parse(window.localStorage.getItem("appsbyPersistent_" + endpoint));
              if (oldState) {
                  view.setState(oldState);
              }
          } catch {
              window.localStorage.removeItem("appsbyPersistent_" + endpoint);
          }
      }
  }
  global.viewConnectors.push(this);
  if (!this.requiresAuth) {
      this.connect();
  } else if (this.requiresAuth && AppsbyGlobalState.state.isAuthenticated){
      this.connect();
  }
}


async function Retrieve(endpoint, view, query, cursor, searchItemStore, contentId, sender, categoriesStore, category) {

    console.log(sender.isLoading)
    if (sender.isLoading) return;
    if (cursor === null) return;

    console.log(sender);

    sender.isLoading = true;
    view.setState(view.state);


    const config = {
        headers: {
            Authorization: AppsbyGlobalState.getAccessToken()
        }
    };

    let data = {
        query: query,
        cursor: cursor,
        endpoint: endpoint,
        count: 2,
        category: category,
        deviceId: await AppsbyGlobalState.getDeviceId()
    }

    Axios.post(global.baseUrl + "search/", data, config).then(result => {
        if (result.status === 200) {
            let existingItems = [];

            if (Array.isArray(view.state[searchItemStore])) {
                view.state[searchItemStore].forEach((item) => {
                    existingItems.push(item);
                })
            }

            if (Array.isArray(result.data.data)) {
                result.data.data.forEach((item) => {
                    existingItems.push(item);
                })
            }

            console.log(result.data.data);

            console.log(existingItems);

            view.setState({[searchItemStore]: existingItems});

            if (result.data.categories && categoriesStore) {
                view.setState({[categoriesStore]: result.data.categories});
            }

            sender.cursor = result.data.next;
            sender.isLoading = false;
            view.setState(view.state);
            onRetrieved(endpoint, view, query, sender.cursor, searchItemStore, contentId, sender, category);

        } else if (result.status === 401) {
            sender.isLoading = false;
            view.setState(view.state);
            AppsbyGlobalState.signOut()
        }
    });

}

function onRetrieved(endpoint, view, query, cursor, searchItemStore, contentId, sender, categoriesStore, category){
  console.log("begin onRetrieve")
  /*if(document.getElementById(contentId).clientHeight*0.7 <= window.innerHeight && cursor !== null){
    console.log("give me content");
    Retrieve(endpoint, view, query, cursor, searchItemStore, contentId, sender, categoriesStore, category);
  }*/
}

//let progress = (window.scrollY / (document.getElementById(contentId).clientHeight - window.innerHeight));
//   if(progress >= 0.7){

/* endpoint = endpoint, view = react component for setstate, searchItemStore = state location, contentId = HTML content ID for infinite scroll, categories store = categories store */
export function AppsbySearchConnection(endpoint, view, searchItemStore, categoriesStore, requiresAuth){
    this.query = "";
    this.view = view;
    this.endpoint = endpoint;
    this.cursor = undefined;
    this.searchItemStore = searchItemStore;
    this.contentId = null;
    this.isLoading = false;
    this.categoriesStore = categoriesStore;
    this.category = null;
    this.requiresAuth = requiresAuth;
    const _this = this;
    this.connect = () => {
      Retrieve(_this.endpoint, _this.view, _this.query, _this.cursor, _this.searchItemStore, _this.contentId, _this, _this.categoriesStore, _this.category)
      window.addEventListener("scroll", function() {
        Retrieve(_this.endpoint, _this.view, _this.query, _this.cursor, _this.searchItemStore, _this.contentId, _this, _this.categoriesStore, _this.category)
      })
    };
    this.setQuery = (event) => {
        this.query = event
        this.cursor = true
        this.view.setState({ [searchItemStore]: [] })

      Retrieve(_this.endpoint, _this.view, _this.query, _this.cursor, _this.searchItemStore, _this.contentId, _this, _this.categoriesStore, _this.category)
    };
    this.setCategory = (event) => {
      this.category = event
      this.cursor = true
      this.view.setState({ [searchItemStore]: [] })

      Retrieve(_this.endpoint, _this.view, _this.query, _this.cursor, _this.searchItemStore, _this.contentId, _this, _this.categoriesStore, _this.category)
    };
    this.destroy = () => {
      window.removeEventListener("scroll", function() {
        Retrieve(_this.endpoint, _this.view, _this.query, _this.cursor, _this.searchItemStore, _this.contentId, _this, _this.categoriesStore, _this.category)
      })
    }
    global.searchConnectors.push(this);
    if (!this.requiresAuth) {
        this.connect();
    } else if (this.requiresAuth && AppsbyGlobalState.state.isAuthenticated){
        this.connect();
    }
}

/*
 if(document.getElementById("content").clientHeight*0.7 <= window.innerHeight && this.state.hasMore === true){
                console.log("give me content");
                this.vm.$dispatch({scroll: true});
            }
 */
