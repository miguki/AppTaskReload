/*
Copyright (C) 2019 by Jan Skibniewski
Licensed under MIT license, see LICENSE.md for details
*/

define(["angular", "qlik"], function (angular, qlik) {

    var $injector = angular.injector(['ng']);
    var $http = $injector.get("$http");
    var serverUrl = window.location.hostname

    return {

        getTaskList: function () {
            return new Promise((resolve, reject) => {
                this.generateXrfkey().then(function (xrfkey) {
                    $http({
                        method: 'GET',
                        url: 'https://' + serverUrl + '/qrs/reloadtask/full?Xrfkey=' + xrfkey,
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
            return location.protocol === 'https'
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
        }
    }
})