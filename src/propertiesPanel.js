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
                    partialReload: {
                        type: "boolean",
                        label: "Partial reload",
                        ref: "props.partialReload",
                        defaultValue: false,
                        show: function (data) {
                            return data.props.reloadType==="currApp";
                        }
                    },
                    desktopDescription: {
                        component: "text",
                        label: "More settings for this extension are available if used in Qlik Sense Entreprise where you can reload either current application or run selected reload task",
                        show: function (data) {
                            return data.props.isDesktop;
                        }
                    },
                    tasksDropdown: {
                        type: "string",
                        component: "dropdown",
                        label: "Task",
                        ref: "props.taskId",
                        options: function () {
                            return utils.getTaskList().then(function(taskList) {
                                return taskList;
                            })
                        },
                        defaultValue: "",
                        show: function (data) {
                            return !data.props.isDesktop && data.props.reloadType === "task";
                        },
                    },
                    waitDescription: {
                        component: "text",
                        label: "Only selected task is monitored for completion. If this app will be reloaded in a result of chained task reload you can use below button setting to wait and watch if current app was reloaded or dismiss waiting time and button will return to it's initial form. Also please remember that if you select task that reloads only other app (doesn't reload this app) it is recommended to deselect below option as the button will remain waiting.",
                        show: function (data) {
                            return !data.props.isDesktop && data.props.reloadType === "task";
                        }
                    },
                    waitAppReload: {
                        type: "boolean",
                        label: "Wait for current app to reload",
                        ref: "props.waitAppReload",
                        defaultValue: true,
                        show: function (data) {
                            return !data.props.isDesktop && data.props.reloadType === "task";
                        }
                    }
                }
            },
            settings: {
                uses: "settings"
            },
            about: {
                label: "About",
                type: "items",
                items: {
                    appTitle: {
                        label: "AppReloadSave",
                        component: "text"
                    },
                    manual: {
                        label: "Extension configuration & manual",
                        component: "link",
                        url: "https://github.com/miguki/AppTaskReload"
                    },
                    createdBy: {
                        label: "Created by Jan Skibniewski",
                        component: "link",
                        url: "https://github.com/miguki"
                    },
                    license: {
                        label: "License: MIT",
                        component: "link",
                        url: "https://opensource.org/licenses/MIT"
                    }
                }
            }
        }
    }
})
