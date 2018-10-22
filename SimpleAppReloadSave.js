define(["qlik", "jquery", "text!./template.html", "css!./css/font-awesome.min.css", "css!./style.css"],
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

				if (typeof (app) === 'undefined') {
					var app = qlik.openApp(qlik.currApp().id);
					$('#buttonlabel').text('Reload & Save');
				};

				$scope.reloadsave = function() {
					$('#buttonlabel').text('Reloading');
					$('#spinner').css('display', '');
					$('#reloadsavebutton').addClass('lui-button--info')
					app.doReload().then(function () {
						$('#buttonlabel').text('Saving')
						app.doSave().then(function () {
							$('#buttonlabel').text('Reloaded & Saved')
							$('#spinner').css('display', 'none');
							$('#reloadsavebutton').removeClass('lui-button--info').addClass('lui-button--success')
							setTimeout(function(){
								$('#reloadsavebutton').removeClass('lui-button--success');
								$('#buttonlabel').text('Reload & Save');
							}, 3000);
						})
					})
				}
			}
			]
		};
	});
