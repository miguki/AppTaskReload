define(["./utils"], function (utils) {
    'use strict'

    return {
        type: "items",
        component: "accordion",
        items: {
            extensionSettings: {
                type: "items",
                label: "Extension Settings",
                items: {
                    reloadType: {
                        type: "string",
                        component: "radiobuttons",
                        label: "Reload type",
                        ref: "props.reloadType",
                        options: [{
                            value: "currApp",
                            label: "Current App"
                        }, {
                            value: "task",
                            label: "Selected Task"
                        }],
                        defaultValue: "currApp"
                    },
                    tasksDropdown: {
                        type: "string",
                        component: "dropdown",
                        label: "Task",
                        ref: "props.taskId",
                        options: function () {
                            return utils.getCurrentUser().then(function (currentUser) {
                                return utils.generateXrfkey().then(function (xrfkey) {
                                    return $.ajax({
                                        type: "GET",
                                        url: "https://" + window.location.hostname + "/hdr/qrs/task/full?Xrfkey=" + xrfkey,
                                        headers: {
                                            "X-Qlik-Xrfkey": xrfkey,
                                            "hdr-usr": currentUser
                                        }
                                    }).then(function (response) {
                                        return response.map(function (item) {
                                            return {
                                                value: item.id,
                                                label: item.name
                                            }
                                        })
                                    })
                                })
                            }).catch(function (error) {
                                console.log('Error getting current user', error)
                            })
                        },
                        defaultValue: ""
                    },
                    waitDescription: {
                        component: "text",
                        label: "There is no possibility to monitor status of chained tasks so you will not be able to check the real status of reloading. Below setting will set the button either to wait and watch if current app was reloaded or dismiss waiting time and button will return to it's initial form"
                    },
                    waitAppReload: {
                        type: "boolean",
                        label: "Wait for current app to reload",
                        ref: "props.waitAppReload",
                        defaultValue: true
                    }
                }
            }
        }
    }
})