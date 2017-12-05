/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 */


var utils = require('../utils/common'),
	Q = require('q');


const logger = require('../utils/loggerWinston');


function findMissingAssets(path, skipEmptyCheck) {
	var deferred = Q.defer();
	var isSkipEmptyCheck  = false;
	if (skipEmptyCheck === 'true') {
		isSkipEmptyCheck = true;
	}

	try {

		// if root path is empty, then there are no assets
		if (utils.isEmpty(path)) {
			logger.warn('No asset folders found. If you do not have any assets in WCM then you can continue.');
			deferred.resolve();

		} else {
			var filelist = utils.findEmptyFolders(path);

			logger.info('Searching for empty asset folders in ' + path + ':');

			if (filelist.length === 0) {
				logger.info('No empty folders found.');
				deferred.resolve();
			} else {

				logger.error('Empty asset folders found:');

				for (var index = 0; index < filelist.length; index++) {
					var filePath = filelist[index];
					logger.error('- ' + filePath);
				}

				logger.error('Verify that all assets have been correctly downloaded before continuing.');
				logger.error('If an asset failed to download, re-run wchconvert pull.');
				logger.error('If assets are missing on the server, delete the empty folders reported by the tool.');

				if (isSkipEmptyCheck) {
					deferred.resolve();
				} else {
                    deferred.reject(new Error('Empty asset folders found. See previous log message for list of empty folders.'));
				}
			}
		}
	} catch (error) {
		deferred.reject(error);
	}

	return deferred.promise;

}

module.exports.main = findMissingAssets;


