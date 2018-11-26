define(["qlik", "jquery", "./utils", "./propertiesPanel", "text!./template.html", "css!./vendors/font-awesome-4.7.0/css/font-awesome.min.css", "css!./stylesheet.css"],
	function (qlik, $, utils, propertiesPanel, template) {

		return {
			initialProperties: {
				props: {
					reloadType: "currApp",
					waitAppReload: true
				}
			},
			template: template,
			definition: propertiesPanel,
			snapshot: {
				canTakeSnapshot: false
			},
			controller: ['$scope', function ($scope) {

				console.log('layout', $scope.layout)

				var app;
				var appLayout;
				var currentUser;
				var serverUrl;
				var extensionObjectId;
				var reloadSaveButtonId;
				var reloadSaveButtonLabelId;
				var spinnerId;
				var client;
				var props;

				function init() {
					initDOMObjects()
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
					utils.getCurrentUser().then(function (user) {
						currentUser = user;
					})
					$(reloadSaveButtonLabelId).text('Reload & Save');
					$scope.tasksList = [];
					props = $scope.layout.props
					client = new utils.HttpClient();
				}

				function initDOMObjects() {
					if (typeof (extensionObjectId) === 'undefined') {
						extensionObjectId = $scope.layout.qInfo.qId;
						reloadSaveButtonId = '#reload-save-button-' + extensionObjectId;
						reloadSaveButtonLabelId = '#reload-save-button-label-' + extensionObjectId;
						spinnerId = '#spinner-' + extensionObjectId;
						$('#reload-save-button').attr('id', reloadSaveButtonId.replace('#', ''));
						$('#reload-save-button-label').attr('id', reloadSaveButtonLabelId.replace('#', ''));
						$('#spinner').attr('id', spinnerId.replace('#', ''));
					}
				}

				init();

				function saveApp() {
					setButton('saving')
					app.doSave().then(function (response) {
						if (response) {
							console.log('saved')
							setButton('success')
						}
						else {
							console.log('save failed')
							setButton('error')
						}
					})
				}

				$(reloadSaveButtonId).on('click', function () {
					console.log(props.reloadType)
					switch (props.reloadType) {
						case "currApp":
							setButton('reloading')
							app.doReload().then(function (response) {
								if (response) {
									saveApp()
								}
								else {
									setButton("ready")
									console.log("failed")
								}
							})
							break
						case "task":
							setButton('requestSent')
							startTask(props.taskId)
							break
					}
				})

				function setButton(type, callback) {
					$(reloadSaveButtonId).attr('class', 'lui-button');
					$(spinnerId).css('display', 'none')
					switch (type) {
						case "ready":
							$(reloadSaveButtonLabelId).text("Reload & Save");
							break
						case "reloading":
							$(reloadSaveButtonLabelId).text("Reloading")
							$(reloadSaveButtonId).addClass("lui-button--info");
							$(spinnerId).css('display', '')
							break
						case "saving":
							$(reloadSaveButtonLabelId).text("Saving")
							$(reloadSaveButtonId).addClass("lui-button--info");
							$(spinnerId).css('display', '')
							break
						case "error":
							$(reloadSaveButtonLabelId).text('Reload Failed')
							$(reloadSaveButtonId).removeClass('lui-button--info').addClass('lui-button--danger')
							$(spinnerId).css('display', 'none')
							setTimeout(function () {
								resetButton();
							}, 3000);
							break
						case "success":
							$(reloadSaveButtonLabelId).text('Saved & Reloaded')
							$(reloadSaveButtonId).addClass('lui-button--success')
							$(spinnerId).css('display', 'none')
							setTimeout(function () {
								resetButton();
							}, 3000);
							break
						case "requestSent":
							$(reloadSaveButtonLabelId).text("Request has been sent")
							$(reloadSaveButtonId).addClass("lui-button--info");
							$(spinnerId).css('display', '')
							break
						case "taskStarted":
							$(reloadSaveButtonLabelId).text("Task has been started")
							$(reloadSaveButtonId).addClass("lui-button--info");
							$(spinnerId).css('display', '')
							setTimeout(function () {
								resetButton();
								if (typeof(callback) !== 'undefined') {
									callback();
								}
							}, 3000);
							break
						case "waiting":
							$(reloadSaveButtonLabelId).text("Waiting for task to reload app")
							$(reloadSaveButtonId).addClass("lui-button--info");
							$(spinnerId).css('display', '')
							break
					}
				}

				function resetButton() {
					$(reloadSaveButtonId).attr('class', 'lui-button');
					$(reloadSaveButtonLabelId).text('Reload & Save');
					$(spinnerId).css('display', 'none')
				}

				function startTask(taskId) {
					utils.generateXrfkey().then(function (xrfkey) {
						var Url = 'https://' + serverUrl + '/hdr/qrs/task/' + taskId + '/start/synchronous?Xrfkey=' + xrfkey;
						var requestHeaders = {
							"X-Qlik-Xrfkey": xrfkey,
							"hdr-usr": currentUser,
							"Content-Type": "application/json"
						}
						var msg = ''
						client.post(msg, Url, requestHeaders, function (response) {
							if (props.waitAppReload) {
								setButton('taskStarted', function(){
									setButton('waiting')
								})
							}
							else {
								setButton('taskStarted')
							}
							console.log('response', JSON.parse(response))
						});
					})
				}
			}
			],
			paint: function () {
				return qlik.Promise.resolve();
			}
		};
	});
