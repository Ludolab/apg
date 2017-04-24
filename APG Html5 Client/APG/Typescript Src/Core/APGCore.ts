﻿interface ObjectConstructor { assign(target: any, ...sources: any[]): any; }
if (typeof Object.assign != 'function') {
	(function () {
		Object.assign = function (target) {
			'use strict';
			if (target === undefined || target === null) { throw new TypeError('Cannot convert undefined or null to object'); }
			var output = Object(target);
			for (var index = 1; index < arguments.length; index++) {
				var source = arguments[index];
				if (source !== undefined && source !== null) 
					for (var nextKey in source) 
						if (source.hasOwnProperty(nextKey)) 
							output[nextKey] = source[nextKey];
			}
			return output;
		};
	})();
}

/*______________________________________________________________________________________________

															App Initialization

______________________________________________________________________________________________*/


function ApgSetup(gameLaunchFunction:(APGSys)=>void, disableNetworking:boolean, isMobile:boolean, gameWidth: number = 400, gameHeight: number = 300, logicIRCChannelName: string, APGInputWidgetDivName: string, allowFullScreen: boolean, engineParms:any, onLoadEnd ) {

	if (gameWidth < 1 || gameWidth > 8192 || gameHeight < 1 || gameHeight > 8192) {
		ConsoleOutput.debugError("ApgSetup: gameWidth and gameHeight are set to " + gameWidth + ", "  + gameHeight +".  These values should be set to the width and height of the desired HTML5 app.  400 and 300 are the defaults.", "sys");
		return;
	}

	if (disableNetworking == false) {
		if (logicIRCChannelName == undefined || logicIRCChannelName == "") {
			ConsoleOutput.debugError("ApgSetup: logicIRCChannelName is not set.  The game cannot work without this.  This should be set to the name of a Twitch IRC channel, with no leading #.", "sys");
			return;
		}
	}
	if (APGInputWidgetDivName == undefined || APGInputWidgetDivName == "") {
		ConsoleOutput.debugError("ApgSetup: APGInputWidgetDivName is not set.  The game cannot work without this.  This should be the name of a valid div to contain the PhaserJS canvas.", "sys");
		return;
	}

	var curJSONAsset = 0;
	var JSONAssets = {};

	function LoadJSONAsset() {
		if (curJSONAsset >= jsonAssetCacheNameList.length) {
			LoadPhaserAssets();
			return;
		}
		$.getJSON(jsonAssetCacheNameList[curJSONAsset], function (data) {
			JSONAssets[jsonAssetCacheNameList[curJSONAsset]] = data.all;

			ConsoleOutput.logAsset(jsonAssetCacheNameList[curJSONAsset]);

			curJSONAsset++;

			LoadJSONAsset();
		});
	}
	LoadJSONAsset();

	function LoadPhaserAssets() {
		var game: Phaser.Game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, APGInputWidgetDivName, {
			preload: () => {
				game.stage.disableVisibilityChange = true;

				if (allowFullScreen) {
					game.scale.pageAlignHorizontally = true;
					game.scale.pageAlignVertically = true;
					game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
					game.scale.setResizeCallback(gameResized, this);
					function gameResized(manager: Phaser.ScaleManager, bounds) {
						var scale = Math.min(window.innerWidth / game.width, window.innerHeight / game.height);
						manager.setUserScale(scale, scale, 0, 0);
					}
				}

				if (phaserAssetCacheList.length == 0) {
					ConsoleOutput.debugWarn("ApgSetup: phaserAssetCacheList.length is 0, so no assets are being cached.  This is probably an error.", "sys");
				}

				for (var k = 0; k < phaserAssetCacheList.length; k++) {
					phaserAssetCacheList[k](game.load);
				}

				for (var k = 0; k < phaserImageList.length; k++) {
					game.load.image(phaserImageList[k], phaserImageList[k]);
				}

				for (var k = 0; k < phaserSoundList.length; k++) {
					game.load.audio(phaserSoundList[k], phaserSoundList[k]);
				}

				if (phaserGoogleWebFontList != undefined && phaserGoogleWebFontList.length > 0) {
					game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
				}
			},
			create: () => {
				game.input.mouse.capture = true;

				if (phaserGoogleWebFontList == undefined || phaserGoogleWebFontList.length == 0) {
					initLaunchGame();
				}
			}
		}, true );

		WebFontConfig = {
			//  'active' means all requested fonts have finished loading.  We need a delay after loading to give browser time to get sorted for fonts, for some reason.
			active: function () { game.time.events.add(Phaser.Timer.SECOND, initLaunchGame, this); },
			google: {
				families: phaserGoogleWebFontList
			}
		};

		function initLaunchGame() {
			if (engineParms.chat == null && disableNetworking == false ) {
				engineParms.chatLoadedFunction = launchGame;
			}
			else {
				launchGame();
			}
		}

		function launchGame() {
			onLoadEnd();
			var apg: APGFullSystem = new APGFullSystem(game, logicIRCChannelName, engineParms.playerName, engineParms.chat, JSONAssets);
			var showingOrientationWarning = false;
			setInterval(function () {
				if (!isMobile) return;

				var width = window.innerWidth || document.body.clientWidth;
				var height = window.innerHeight || document.body.clientHeight;
				if (height > width) {
					if (!showingOrientationWarning) {
						showingOrientationWarning = true;
						document.getElementById("orientationWarning").style.display = '';
						document.getElementById(APGInputWidgetDivName).style.display = 'none';
					}
				}
				else {
					if (showingOrientationWarning) {
						showingOrientationWarning = false;
						document.getElementById("orientationWarning").style.display = 'none';
						document.getElementById(APGInputWidgetDivName).style.display = '';
					}
				}
				apg.update();
			}, 1000 / 60);
			gameLaunchFunction(apg);
			//StartGame( apg );
		}
	}
}