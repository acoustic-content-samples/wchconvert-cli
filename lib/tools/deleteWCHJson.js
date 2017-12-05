/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

var utils = require('../utils/common');
const logger = require('../utils/loggerWinston');

var args = [];

var usage = 'Usage: node deletWCHJson.js -connectionId <connectionId> [-dir <dir>]';

var dir = '.';
var connectionId = '';
var rootPath = '';

try {
	args = utils.processArgs(process.argv, 0,0, ['connectionId'],['dir']);
} catch (err) {
	logger.error(err);
	logger.info(usage);
	process.exit(1);
}


if (args.dir !== undefined) {
	dir = args.dir;
} 

connectionId = args.connectionId;

rootPath = dir + '/' + connectionId;

logger.info('Deleting WCH Json from path: ' + rootPath);


function deleteWCHJson(path) {

    var fileList = utils.findFiles(path);
    for (var index = 0; index < fileList.length; index++) {

        var filePath = fileList[index];
        if (filePath.endsWith('_amd.json') || filePath.endsWith('_tmd.json') || filePath.endsWith('_cmd.json')) {

            logger.info('DELETING FILE: ' + filePath);
            utils.deleteFile(filePath);
        }
    }
}


deleteWCHJson(dir);