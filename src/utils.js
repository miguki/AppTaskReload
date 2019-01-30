/*
Copyright (C) 2019 by Jan Skibniewski
Licensed under MIT license, see LICENSE.md for details
*/

define(["qlik"], function (qlik) {

    return {

        getTaskList: function () {
            return new Promise((resolve, reject) => {
                qlik.callRepository('/qrs/reloadtask/full').success(function (response) {
                    var taskList = response.map(function (item) {
                        return {
                            value: item.id,
                            label: item.name
                        }
                    })
                    if (taskList != null){
                        resolve(taskList)
                    }
                });
            })
        },

        HttpClient: function () {
            this.get = function (aUrl, requestHeaders, aCallback) {
                var anHttpRequest = new XMLHttpRequest();
                anHttpRequest.onreadystatechange = function () {
                    if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                        aCallback(anHttpRequest.responseText);
                }
                anHttpRequest.open("GET", aUrl, true);
                for (var key in requestHeaders) {
                    anHttpRequest.setRequestHeader(key, requestHeaders[key])
                }
                anHttpRequest.send(null);
            }
            this.post = function (msg, aUrl, requestHeaders, aCallback) {
                var anHttpRequest = new XMLHttpRequest();
                anHttpRequest.onreadystatechange = function () {
                    if (anHttpRequest.readyState == 4 && anHttpRequest.status == 201)
                        aCallback(anHttpRequest.responseText);
                }
                anHttpRequest.open("POST", aUrl, true);
                for (var key in requestHeaders) {
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
                    isSecure: location.protocol === 'https'
                };
                var currentUser
                var global = qlik.getGlobal(config);
                global.getAuthenticatedUser(function (reply) {
                    var userId = reply.qReturn.match(/UserId=(.*)/)
                    var userDirectory = reply.qReturn.match(/UserDirectory=(.*);/)
                    if (userId != null && userDirectory != null) {
                        currentUser = userDirectory[1] + '\\' + userId[1]
                        resolve(currentUser)
                    }
                    else {
                        reject(new Error(reply))
                    }
                })
            });
        },

        isDesktop: function () {
            return new Promise((resolve, reject) => {
                var config = {
                    host: window.location.hostname,
                    prefix: "/",
                    port: window.location.port,
                    isSecure: location.protocol === 'https'
                };
                var isDesktop
                var global = qlik.getGlobal(config);
                global.isPersonalMode(function (reply) {
                    isDesktop = reply.qReturn;
                    resolve(isDesktop)
                });
            })
        },

        isSecure: function () {
            if (location.protocol === 'https') {
                return true
            } else {
                return false
            }
        },

        //not used for now

        generateXrfkey: function () {
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
})