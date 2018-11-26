define(["qlik"], function (qlik) {

    return {

        HttpClient: function () {
            this.get = function (aUrl, requestHeaders, aCallback) {
                var anHttpRequest = new XMLHttpRequest();
                anHttpRequest.onreadystatechange = function () {
                    if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                        aCallback(anHttpRequest.responseText);
                }
                anHttpRequest.open("GET", aUrl, true);
                console.log(anHttpRequest)
                for (var key in requestHeaders){
                    anHttpRequest.setRequestHeader(key, requestHeaders[key])
                }
                console.log(anHttpRequest)
                anHttpRequest.send(null);
            }
            this.post = function (msg, aUrl, requestHeaders, aCallback) {
                var anHttpRequest = new XMLHttpRequest();
                anHttpRequest.onreadystatechange = function () {
                    if (anHttpRequest.readyState == 4 && anHttpRequest.status == 201)
                        aCallback(anHttpRequest.responseText);
                }
                anHttpRequest.open("POST", aUrl, true);
                for (var key in requestHeaders){
                    anHttpRequest.setRequestHeader(key, requestHeaders[key])
                }
                anHttpRequest.send(JSON.stringify(msg));
            }

            
        },
        
        getCurrentUser: function () {
            return new Promise((resolve, reject) => {
                var config = {
                    host: window.location.hostname,
                    prefix: "/",
                    port: window.location.port,
                    isSecure: true
                };
                var currentUser
                var global = qlik.getGlobal(config);
                global.getAuthenticatedUser(function (reply) {
                    var userId = reply.qReturn.match(/UserId=(.*)/)
                    var userDirectory = reply.qReturn.match(/UserDirectory=(.*);/)
                    if (userId != null && userDirectory != null) {
                        currentUser = userDirectory[1] + '\\' + userId[1]
                        console.log("currentUserProperties", currentUser)
                        resolve(currentUser)
                    }
                    else {
                        reject(new Error(reply))
                    }
                })
            });
        },

        generateXrfkey: function(){
            return new Promise((resolve) => {
                var xrfkey = "";
                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                for (var i = 0; i < 16; i++) {
                    xrfkey += possible.charAt(Math.floor(Math.random() * possible.length));
                }
                resolve(xrfkey)
            })
        }
    
    }
}
)