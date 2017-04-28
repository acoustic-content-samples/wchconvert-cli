/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

var dxUtils = require("./dxUtils.js");

const logger = require("./loggerWinston.js");


var args = [];

var usage = "Usage: node deletWCHJson.js -connectionId <connectionId> [-dir <dir>]";

var dir = "dir";
var connectionId = "";
var rootPath = "";

try {
	args = dxUtils.processArgs(process.argv, 0,0, ['connectionId'],['dir']);
} catch (err) {
	logger.error(err);
	logger.info(usage);
	process.exit(1);
}


if (args['dir'] != undefined) {
	dir = args['dir'];
} 

connectionId = args['connectionId'];

rootPath = dir + "/" + connectionId;

logger.info("Deleting WCH Json from path: " + rootPath);

dxUtils.deleteWCHJson(dir);