/*
Copyright (C) 2019 by Jan Skibniewski
Licensed under MIT license, see LICENSE.md for details
*/

define(["./utils"], function (utils) {
    'use strict'

    return {
        type: "items",
        component: "accordion",
        items: {
            reloadSettings: {
                type: "items",
                label: "Reload Settings",
                items: {
                    isDesktop: {
                        component: "text",
                        ref: "props.isDesktop",
                        defaultValue: false,
                        show: false
                    },
                    desktopDescription: {
                        component: "text",
                        label: "Settings for this extension are available if used in Qlik Sense Entreprise where you can reload either current application or run selected reload task",
                        show: function (data) {
                            return data.props.isDesktop;
                        }
                    },
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
                        defaultValue: "currApp",
                        show: function (data) {
                            return !data.props.isDesktop;
                        }
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
                        defaultValue: "",
                        show: function (data) {
                            return !data.props.isDesktop;
                        },
                    },
                    waitDescription: {
                        component: "text",
                        label: "There is no possibility to monitor status of chained tasks so you will not be able to check the real status of reloading. Below setting will set the button either to wait and watch if current app was reloaded or dismiss waiting time and button will return to it's initial form",
                        show: function (data) {
                            return !data.props.isDesktop;
                        }
                    },
                    waitAppReload: {
                        type: "boolean",
                        label: "Wait for current app to reload",
                        ref: "props.waitAppReload",
                        defaultValue: true,
                        show: function (data) {
                            return !data.props.isDesktop;
                        }
                    }
                }
            },
            settings:{
				uses: "settings"
            },
            about:{
                label: "About",
                type: "items",
                items: {
                    appTitle:{
                        label: "AppReloadSave",
                        component: "text"
                    },
                    createdBy:{
                        label: "Created by Jan Skibniewski",
                        component: "link",
                        url: "https://github.com/miguki"
                    },
                    license:{
                        label: "License: MIT",
                        component: "link",
                        url: "https://opensource.org/licenses/MIT"
                    }
                }
            }
        }
    }
})
