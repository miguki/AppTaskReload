/*
Copyright (C) 2019 by Jan Skibniewski
Licensed under MIT license, see LICENSE.md for details
*/

define(["qlik", "jquery", "./utils", "./propertiesPanel", "text!./template.html", "css!./stylesheet.css"],
	function (qlik, $, utils, propertiesPanel, template) {

		return {
			initialProperties: {
				props: {
					reloadType: "currApp",
					waitAppReload: true
				},
				showTitles: false
			},
			template: template,
			definition: propertiesPanel,
			snapshot: {
				canTakeSnapshot: false
			},
			controller: ['$scope', function ($scope) {

				var app;
				var appLayout;
				var currentUser;
				var serverUrl;
				var extensionObjectId;
				var reloadSaveButtonId;
				var reloadSaveButtonLabelId;
				var reloadSaveButtonIconId;
				var client;
				var props;

				function init() {
					return new Promise((resolve) => {
						initDOMObjects().then(function () {
							utils.isDesktop().then(function (isDesktopReply) {
								$scope.backendApi.getProperties().then(function (reply) {
									reply.props.isDesktop = isDesktopReply
									$scope.backendApi.setProperties(reply);
								});
							})
							props = $scope.layout.props
							serverUrl = window.location.hostname;
							app = qlik.openApp(qlik.currApp().id)
							app.getAppLayout(function (response) {
								appLayout = response;
								if (sessionStorage.getItem('lastReload') === null) {
									sessionStorage.setItem('lastReload', appLayout.qLastReloadTime)
								}
								else {
									var wasReloaded = sessionStorage.getItem('lastReload') < appLayout.qLastReloadTime
									if (wasReloaded) {
										setButton("success")
									}
									sessionStorage.setItem('lastReload', appLayout.qLastReloadTime)
								}
							})
							if (!props.isDesktop) {
								utils.getCurrentUser().then(function (user) {
									currentUser = user;
								}).catch(function (error) {
									console.log(error)
								})
								client = new utils.HttpClient();
							}
							resetButton();
						})
						resolve();
					})
				}

				function initDOMObjects() {
					return new Promise((resolve) => {
						if (typeof (extensionObjectId) === 'undefined') {
							extensionObjectId = $scope.layout.qInfo.qId;
							reloadSaveButtonId = '#reload-save-button-' + extensionObjectId;
							reloadSaveButtonLabelId = '#reload-save-button-label-' + extensionObjectId;
							reloadSaveButtonIconId = '#reload-save-button-icon-' + extensionObjectId;
							$('#reload-save-button').attr('id', reloadSaveButtonId.replace('#', ''));
							$('#reload-save-button-label').attr('id', reloadSaveButtonLabelId.replace('#', ''));
							$('#reload-save-button-icon').attr('id', reloadSaveButtonIconId.replace('#', ''));
						}
						resolve();
					})

				}

				function saveApp() {
					setButton('saving')
					app.doSave().then(function (response) {
						if (response) {
							setButton('success')
						}
						else {
							setButton('error')
						}
					})
				}

				function setButton(type, callback) {
					$(reloadSaveButtonId).attr('class', 'lui-button');
					$(reloadSaveButtonIconId).removeClass("rotating")
					switch (type) {
						case "ready":
							$(reloadSaveButtonLabelId).text("Reload");
							break
						case "reloading":
							$(reloadSaveButtonLabelId).text("Reloading")
							$(reloadSaveButtonId).addClass("lui-button--info");
							$(reloadSaveButtonIconId).addClass("rotating")
							break
						case "saving":
							$(reloadSaveButtonLabelId).text("Saving")
							$(reloadSaveButtonId).addClass("lui-button--info");
							$(reloadSaveButtonIconId).addClass("rotating")
							break
						case "error":
							$(reloadSaveButtonLabelId).text('Reload Failed')
							$(reloadSaveButtonId).removeClass('lui-button--info').addClass('lui-button--danger')
							$(reloadSaveButtonIconId).removeClass("rotating")
							setTimeout(function () {
								resetButton();
							}, 3000);
							break
						case "success":
							$(reloadSaveButtonLabelId).text('Reloaded & Saved')
							$(reloadSaveButtonId).addClass('lui-button--success')
							$(reloadSaveButtonIconId).removeClass("rotating")
							setTimeout(function () {
								resetButton();
							}, 3000);
							break
						case "requestSent":
							$(reloadSaveButtonLabelId).text("Request has been sent")
							$(reloadSaveButtonId).addClass("lui-button--info");
							$(reloadSaveButtonIconId).addClass("rotating")
							break
						case "taskStarted":
							$(reloadSaveButtonLabelId).text("Task has been started")
							$(reloadSaveButtonId).addClass("lui-button--info");
							$(reloadSaveButtonIconId).addClass("rotating")
							setTimeout(function () {
								resetButton();
								if (typeof (callback) !== 'undefined') {
									callback();
								}
							}, 3000);
							break
						case "waiting":
							$(reloadSaveButtonLabelId).text("Waiting for app to be reloaded")
							$(reloadSaveButtonId).addClass("lui-button--info");
							$(reloadSaveButtonIconId).addClass("rotating")
							break
					}
				}

				function resetButton() {
					$(reloadSaveButtonId).attr('class', 'lui-button');
					$(reloadSaveButtonLabelId).text('Reload');
					$(reloadSaveButtonIconId).removeClass("rotating")
				}

				function startTask(taskId) {
					qlik.callRepository('/qrs/task/' + taskId + '/start/synchronous', 'POST').success(function (response) {
						if (props.waitAppReload) {
							setButton('taskStarted', function () {
								setButton('waiting')
							})
						}
						else {
							setButton('taskStarted')
						}
					})

				}

				init().then(function () {
					$(reloadSaveButtonId).on('click', function () {
						switch (props.reloadType) {
							case "currApp":
								setButton('reloading')
								app.doReload().then(function (response) {
									if (response) {
										saveApp()
									}
									else {
										setButton("error")
									}
								})
								break
							case "task":
								setButton('requestSent')
								startTask(props.taskId)
								break
						}
					})
				});

			}
			],
			paint: function () {
				return qlik.Promise.resolve();
			}
		};
	});