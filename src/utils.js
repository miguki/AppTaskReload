/*
Copyright (C) 2019-2020 by Jan Skibniewski
Licensed under MIT license, see LICENSE.md for details
*/

define(["angular", "qlik"], function (angular, qlik) {

    var $injector = angular.injector(['ng']);
    var $http = $injector.get("$http");
    var serverUrl = window.location.hostname
    var serverProxyPrefix = '/'
    var serverProxyPrefixHttp = ''
    var serverPort = window.location.port
    var serverProtocol = window.location.protocol

    var url = window.location.href
    var prefixMatch = url.match(window.location.hostname + '(\/.*)\/sense')
    if (prefixMatch !== null) {
        serverProxyPrefix = prefixMatch[1] + '/'
        serverProxyPrefixHttp = prefixMatch[1]
    }

    var requestURI = serverProtocol + '//' + serverUrl + serverProxyPrefixHttp

    var requestConfig = {
        host: serverUrl,
        prefix: serverProxyPrefix,
        port: serverPort,
        isSecure: serverProtocol === 'https:'
    };

    return {

        getTaskList: function () {
            return new Promise((resolve, reject) => {
                this.generateXrfkey().then(function (xrfkey) {
                    $http({
                        method: 'GET',
                        url: requestURI + '/qrs/reloadtask/full?Xrfkey=' + xrfkey,
                        headers: { 'X-Qlik-Xrfkey': xrfkey }
                    }).then(function (response) {
                        var taskList = response.data.map(function (item) {
                            return {
                                value: item.id,
                                label: item.name
                            }
                        })
                        if (taskList != null) {
                            resolve(taskList)
                        }
                    })
                })
            })
        },

        getCurrentUser: function () {
            return new Promise((resolve, reject) => {
                var config = requestConfig
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
                var config = requestConfig
                var isDesktop
                var global = qlik.getGlobal(config);
                global.isPersonalMode(function (reply) {
                    isDesktop = reply.qReturn;
                    resolve(isDesktop)
                });
            })
        },

        generateXrfkey: function () {
            return new Promise((resolve) => {
                var xrfkey = "";
                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                for (var i = 0; i < 16; i++) {
                    xrfkey += possible.charAt(Math.floor(Math.random() * possible.length));
                }
                resolve(xrfkey)
            })
        },

        getRequestURI: function () {
            return requestURI
        }
    }
})