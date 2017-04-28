/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */


var cp = require('child_process');

const logger = require('./loggerWinston.js');

function isInstalled() {
	
	var isInstalled  = false;
	
	try {
		cp.execSync("wchtools -V" , {stdio: 'ignore'});
		isInstalled = true;
	} catch(error) {
		
	}
	
	return isInstalled;
	
}

function help() {
	try {
		cp.execSync("wchtools -help", {stdio:[0,1,2]});
	} catch(error) {
		
	}
}

function pushAssets(dir, password) {
	try {
		
		var params = " -av --dir \"" + dir +"\"";
		if (password != undefined && password) {
			params += " --password " + password;
		}
			
		logger.info("Running task: wchtools push" + params);
		cp.execSync("wchtools push" + params, {stdio:[0,1,2]});
		logger.info("Completed task: wchtools push" + params);
	} catch(error) {
		
	}
}


function pushTypes(dir, password) {
		var params = " -tv --dir " + dir;
		if (password != undefined && password) {
			params += " --password " + password;
		}
			
		logger.info("Running task: wchtools push" + params);
		cp.execSync("wchtools push" + params, {stdio:[0,1,2]});
		logger.info("Completed task: wchtools push" + params);
}

function pushContent(dir, password) {
		var params = " -cv --dir " + dir;
		if (password != undefined && password) {
			params += " --password " + password;
		}
			
		logger.info("Running task: wchtools push" + params);
		cp.execSync("wchtools push" + params, {stdio:[0,1,2]});
		logger.info("Completed task: wchtools push" + params);
	
	
}

function push(mode, dir, password) {
		var params = " -atcv --dir " + dir;
		if (password != undefined && password) {
			params += " --password " + password;
		}
			
		logger.info("Running task: wchtools push" + params);
		cp.execSync("wchtools push" + params, {stdio:[0,1,2]});
		logger.info("Completed task: wchtools push" + params);
}

module.exports.isInstalled = isInstalled;
module.exports.help = help;
module.exports.push = push;
module.exports.pushAssets = pushAssets;
module.exports.pushTypes = pushTypes;
module.exports.pushContent = pushContent;
