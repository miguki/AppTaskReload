define(["qlik", "jquery", "text!./template.html", "css!./vendors/font-awesome-4.7.0/css/font-awesome.min.css", "css!./stylesheet.css"],
	function (qlik, $, template) {

		return {
			initialProperties: {

			},
			template: template,
			definition: {
				type: "items",
				component: "accordion",
				items: {
					settings: {
						uses: "settings"
					}
				}
			},
			snapshot: {
				canTakeSnapshot: false
			},
			controller: ['$scope', function ($scope) {

				if(typeof(extensionObjectId) === 'undefined') {
					var extensionObjectId = $scope.layout.qInfo.qId;
					var reloadSaveButtonId = '#reload-save-button-' + extensionObjectId;
					var reloadSaveButtonLabelId = '#reload-save-button-label-' + extensionObjectId;
					var spinnerId = '#spinner-' + extensionObjectId;
					$('#reload-save-button').attr('id', reloadSaveButtonId.replace('#', ''));
					$('#reload-save-button-label').attr('id', reloadSaveButtonLabelId.replace('#', ''));
					$('#spinner').attr('id', spinnerId.replace('#', ''));
				}
				
				if(typeof(app) === 'undefined') {
					var app = qlik.openApp(qlik.currApp().id);
					$(reloadSaveButtonLabelId).text('Reload & Save');
				};
				
				function saveApp(){
					$(reloadSaveButtonLabelId).text('Saving')
					app.doSave().then(function(response){
						if(response){
							console.log('saved')
							$(reloadSaveButtonLabelId).text('Saved & Reloaded')
							$(reloadSaveButtonId).removeClass('lui-button--info').addClass('lui-button--success')
							$(spinnerId).css('display', 'none')
							setTimeout(function () {
								resetButton()
							}, 3000);
						}
						else {
							console.log('save failed')
							$(reloadSaveButtonLabelId).text('Save Failed')
							$(reloadSaveButtonId).removeClass('lui-button--info').addClass('lui-button--danger')
							$(spinnerId).css('display', 'none')
							setTimeout(function () {
								resetButton()
							}, 3000);
						}
					})
				}

				$(reloadSaveButtonId).on('click', function(){
					$(reloadSaveButtonLabelId).text('Reloading')
					$(reloadSaveButtonId).addClass('lui-button--info')
					$(spinnerId).css('display', '')
					app.doReload().then(function(response){
						if(response){
							console.log('reloaded')
							saveApp()
						}
						else{
							console.log('reload failed')
							$(reloadSaveButtonLabelId).text('Reload Failed')
							$(reloadSaveButtonId).removeClass('lui-button--info').addClass('lui-button--danger')
							$(spinnerId).css('display', 'none')
							setTimeout(function () {
								resetButton()
							}, 3000);
						}
					})
				
				})

				function resetButton () {
					$(reloadSaveButtonId).removeClass().addClass('lui-button');
					$(reloadSaveButtonLabelId).text('Reload & Save');
				}

				$('#reload-task-button').on('click', function(){
					var HttpClient = function () {
						this.get = function (aUrl, aCallback) {
							var anHttpRequest = new XMLHttpRequest();
							anHttpRequest.onreadystatechange = function () {
								if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
									aCallback(anHttpRequest.responseText);
							}
							anHttpRequest.open("GET", aUrl, true);
							anHttpRequest.setRequestHeader("X-Qlik-Xrfkey", "abcdefghijklmnop");
							anHttpRequest.setRequestHeader("hdr-usr", "WIN-50635PQO9HR\\jan");
							console.log(anHttpRequest)
							anHttpRequest.send(null);
						}
						this.post = function (msg, aUrl, aCallback) {
							var anHttpRequest = new XMLHttpRequest();
							anHttpRequest.onreadystatechange = function () {
								if (anHttpRequest.readyState == 4 && anHttpRequest.status == 201)
									aCallback(anHttpRequest.responseText);
							}
							anHttpRequest.open("POST", aUrl, true);
							anHttpRequest.setRequestHeader("Content-Type", "application/json")
							anHttpRequest.send(JSON.stringify(msg));
						}
					}
	
					var client = new HttpClient();
					var transactionsUrl = 'https://sense.datawizards.pl/hdr/qrs/task/full?Xrfkey=abcdefghijklmnop';
				   
					$scope.titleModel = "";
					$scope.amountModel = null;
					$scope.transactionsList = [];
	
					
						client.get(transactionsUrl, function (response) {
							$scope.$apply(function(){
								$scope.transactionsList = JSON.parse(response);
							})
							console.log('tasksList', $scope.transactionsList);
						});
				
				})
			}
			]
		};
	});
