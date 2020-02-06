/*
Copyright (C) 2019 by Jan Skibniewski
Licensed under MIT license, see LICENSE.md for details
*/

define(["angular", "qlik", "jquery", "./utils", "./propertiesPanel", "text!./template.html", "css!./stylesheet.css"],
	function (angular, qlik, $, utils, propertiesPanel, template) {

		return {
			initialProperties: {
				props: {
					reloadType: "currApp",
					waitAppReload: true,
					buttonText: "Reload",
					readyButtonText: "Reload"
				},
				showTitles: false
			},
			template: template,
			definition: propertiesPanel,
			support: {
				snapshot: false,
				export: false,
				exportData: false
			},
			controller: ['$scope', function ($scope) {

				var $injector = angular.injector(['ng']);
				var $http = $injector.get("$http");
				var app;
				var serverUrl;
				var extensionObjectId;
				var reloadSaveButtonId;
				var reloadSaveButtonLabelId;
				var reloadSaveButtonIconId;
				var reloadSaveButtonWrapperId;
				var reloadSaveButtonLabelWrapperId;
				var reloadSaveButtonIconWrapperId;
				var props;
				var readyButtonText;
				var generatedTaskId;
				var taskStatus = 99
				var taskChecking = false
				var buttonStatusStack = []
				var bufferedStatusStack = []
				const taskEnums = {
					0: "NeverStarted",
					1: "Triggered",
					2: "Started",
					3: "Queued",
					4: "AbortInitiated",
					5: "Aborting",
					6: "Aborted",
					7: "FinishedSuccess",
					8: "FinishedFail",
					9: "Skipped",
					10: "Retry",
					11: "Error",
					12: "Reset",
					99: "Not yet started"
				}

				function StatusStackElement(status, priority, buttonText, buttonClass, buttonRunning) {
					this.status = status
					this.priority = priority
					if (typeof buttonText === 'function') {
						this.buttonText = buttonText()
					}
					else {
						this.buttonText = buttonText
					}
					if (typeof buttonClass === 'function') {
						this.buttonClass = buttonClass()
					}
					else {
						this.buttonClass = buttonClass
					}
					this.buttonRunning = buttonRunning
				}

				const buttonStatuses = [
					{
						status: 'ready',
						priority: 1,
						buttonText: function () {
							return readyButtonText
						},
						buttonClass: 'lui-button',
						buttonRunning: false
					},
					{
						status: 'reloading',
						priority: 1,
						buttonText: 'Reloading',
						buttonClass: 'lui-button lui-button--info',
						buttonRunning: true
					},
					{
						status: 'saving',
						priority: 1,
						buttonText: 'Saving',
						buttonClass: 'lui-button lui-button--info',
						buttonRunning: true
					},
					{
						status: 'error',
						priority: 1,
						buttonText: 'Reload failed',
						buttonClass: 'lui-button lui-button--danger',
						buttonRunning: false
					},
					{
						status: 'success',
						priority: 2,
						buttonText: 'Reloaded & Saved',
						buttonClass: 'lui-button lui-button--success',
						buttonRunning: false
					},
					{
						status: 'taskStarted',
						priority: 1,
						buttonText: 'Task started',
						buttonClass: 'lui-button lui-button--info',
						buttonRunning: true
					},
					{
						status: 'waiting',
						priority: 1,
						buttonText: 'Waiting',
						buttonClass: 'lui-button lui-button--info',
						buttonRunning: true
					},
					{
						status: 'taskStatus',
						priority: 0,
						buttonText: function () {
							return 'Task status: ' + taskEnums[taskStatus]
						},
						buttonClass: function () {
							if (taskStatus === 6 || taskStatus === 8 || taskStatus === 9 || taskStatus === 11 || taskStatus === 12) {
								return 'lui-button lui-button--danger'
							}
							else {
								return 'lui-button lui-button--info'
							}
						},
						buttonRunning: true
					}
				]

				var stackInterval = setInterval(rollStatus, 1000)

				function rollStatus() {
					if (bufferedStatusStack.length > 0 && !taskChecking) {
						buttonStatusStack.push(...bufferedStatusStack)
						bufferedStatusStack = []
					}

					if (buttonStatusStack.length > 0) {
						var status = buttonStatusStack.shift()
						$(reloadSaveButtonLabelId).text(status.buttonText)
						$(reloadSaveButtonId).attr('class', status.buttonClass);
						if (status.buttonRunning) {
							$(reloadSaveButtonIconId).addClass("rotating")
						}
						else {
							$(reloadSaveButtonIconId).removeClass("rotating")
						}
					}
				}

				function setButton(type) {
					var s = buttonStatuses.find(s => s.status === type);
					var status = new StatusStackElement(s.status, s.priority, s.buttonText, s.buttonClass, s.buttonRunning)

					if ((status.status === 'success' || status.status === 'ready') && taskChecking) {
						bufferedStatusStack.push(status)
					}
					else {
						if (buttonStatusStack.length > 0) {
							if (JSON.stringify(status) !== JSON.stringify(buttonStatusStack[buttonStatusStack.length - 1])) {
								buttonStatusStack.push(status)
							}
						}
						else {
							buttonStatusStack.push(status)
						}
					}
				}

				function setProperty(key, value) {
					$scope.backendApi.getProperties().then(function (reply) {
						reply.props[key] = value
						$scope.backendApi.setProperties(reply)
					});
				}

				function init() {
					return new Promise((resolve) => {
						initDOMObjects().then(function () {
							utils.isDesktop().then(function (isDesktopReply) {
								setProperty('isDesktop', isDesktopReply)
							})
							props = $scope.layout.props
							serverUrl = window.location.hostname
							app = qlik.openApp(qlik.currApp().id)
							app.getAppLayout(function (appLayout) {
								if (sessionStorage.getItem('lastReload') === null) {
									sessionStorage.setItem('lastReload', appLayout.qLastReloadTime)
								}
								else {
									var wasReloaded = sessionStorage.getItem('lastReload') < appLayout.qLastReloadTime
									if (wasReloaded && props.reloadType === 'task') {
										setButton("success")
										setButton("ready")
									}
								}
								sessionStorage.setItem('lastReload', appLayout.qLastReloadTime)
							})
							readyButtonText = props.readyButtonText
							$scope.$watch('layout.props.readyButtonText', function (newValue, oldValue) {
								if (newValue === oldValue) {
									return;
								}
								readyButtonText = props.readyButtonText
								setButton("ready")
							}, true);
							setButton("ready")
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
							reloadSaveButtonWrapperId = '#reload-save-button-wrapper-' + extensionObjectId
							reloadSaveButtonLabelWrapperId = '#reload-save-button-label-wrapper-' + extensionObjectId
							reloadSaveButtonIconWrapperId = '#reload-save-button-icon-wrapper-' + extensionObjectId
							maximizeButtonSelector = 'div[tid=' + extensionObjectId + '] a[tid=nav-menu-zoom-in]'
							$('#reload-save-button').attr('id', reloadSaveButtonId.replace('#', ''));
							$('#reload-save-button-label').attr('id', reloadSaveButtonLabelId.replace('#', ''));
							$('#reload-save-button-icon').attr('id', reloadSaveButtonIconId.replace('#', ''));
							$('#reload-save-button-wrapper').attr('id', reloadSaveButtonWrapperId.replace('#', ''));
							$('#reload-save-button-label-wrapper').attr('id', reloadSaveButtonLabelWrapperId.replace('#', ''));
							$('#reload-save-button-icon-wrapper').attr('id', reloadSaveButtonIconWrapperId.replace('#', ''));
							$('#taskButton').attr('id', 'taskButton-' + extensionObjectId);
							$(maximizeButtonSelector).css('display', 'none');
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
						setButton('ready')
					})
				}

				function startTask(taskId) {
					taskStatus = 99
					utils.generateXrfkey().then(function (xrfkey) {
						$http({
							method: 'POST',
							url: 'https://' + serverUrl + '/qrs/task/' + taskId + '/start/synchronous?Xrfkey=' + xrfkey,
							headers: { 'X-Qlik-Xrfkey': xrfkey }
						}).then(function (response) {
							generatedTaskId = $scope.generatedTaskId = response.data.value;
							if (props.waitAppReload) {
								taskChecking = true
								setButton('taskStatus')
								var intervalId = setInterval(checkTask, 500)
								function checkTask() {
									checkTaskById(generatedTaskId).then(function () {
										setButton('taskStatus')
										if (taskStatus === 6 || taskStatus === 7 || taskStatus === 8 || taskStatus === 9 || taskStatus === 11 || taskStatus === 12) {
											taskChecking = false
											if (taskStatus === 6 || taskStatus === 8 || taskStatus === 9 || taskStatus === 11 || taskStatus === 12) {
												setButton("error")
												setButton("ready")
											}
											clearInterval(intervalId)
										}
									})
								}
							}
							else {
								setButton('taskStarted')
								setButton('ready')
							}
						})
					})
				}

				function checkTaskById(taskGUID) {
					return new Promise((resolve) => {
						utils.generateXrfkey().then(function (xrfkey) {
							$http({
								method: 'GET',
								url: 'https://' + serverUrl + '/qrs/executionresult?Xrfkey=' + xrfkey + '&filter=ExecutionId eq ' + taskGUID,
								headers: { 'X-Qlik-Xrfkey': xrfkey }
							}).then(function (response) {
								taskStatus = taskStatus = JSON.parse(response.data[0].status)
							})
							resolve();
						})
					})
				}

				init().then(function () {
					$(reloadSaveButtonId).on('click', function () {
						switch (props.reloadType) {
							case "currApp":
								setButton('reloading')
								app.doReload(0, props.partialReload).then(function (response) {
									if (response) {
										saveApp()
									}
									else {
										setButton("error")
									}
								})
								break
							case "task":
								startTask(props.taskId)
								break
						}
					})
				});
			}],

			paint: function ($element, layout) {
				var extensionObjectId = layout.qInfo.qId;
				var reloadSaveButtonId = '#reload-save-button-' + extensionObjectId
				var reloadSaveButtonWrapperId = '#reload-save-button-wrapper-' + extensionObjectId
				var reloadSaveButtonLabelWrapperId = '#reload-save-button-label-wrapper-' + extensionObjectId
				var reloadSaveButtonIconWrapperId = '#reload-save-button-icon-wrapper-' + extensionObjectId
				var reloadSaveButtonIconId = '#reload-save-button-icon-' + extensionObjectId
				var buttonSize = $(reloadSaveButtonId).width()
				if (buttonSize < 245) {
					$(reloadSaveButtonWrapperId).removeClass('reload-save-button-wrapper')
					$(reloadSaveButtonLabelWrapperId).addClass('reload-save-button-label-wrapper-text-hidden')
					$(reloadSaveButtonIconWrapperId).removeClass('reload-save-button-icon-wrapper')
					$(reloadSaveButtonIconId).addClass('reload-save-button-icon-text-hidden')
				}
				else {
					$(reloadSaveButtonWrapperId).addClass('reload-save-button-wrapper')
					$(reloadSaveButtonLabelWrapperId).removeClass('reload-save-button-label-wrapper-text-hidden')
					$(reloadSaveButtonIconWrapperId).addClass('reload-save-button-icon-wrapper')
					$(reloadSaveButtonIconId).removeClass('reload-save-button-icon-text-hidden')
				}
				return qlik.Promise.resolve();
			}
		};
	});