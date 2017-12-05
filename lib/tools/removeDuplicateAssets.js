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
	Q = require('q'),
    fs = require('fs');


const logger = require('../utils/loggerWinston');

function removeDuplicate(md5Hashes, md5Hash, duplicateAssets, isSkipDelete) {
    var assetList = md5Hashes[md5Hash];
    var masterDxId = '';
    var numDeleted = 0;

    for (var index = 0; index < assetList.length; index++) {
        if (index === 0) {
            masterDxId = assetList[index].id;
            duplicateAssets[masterDxId] = [ assetList[index].id ];
        } else {
            duplicateAssets[masterDxId].push(assetList[index].id);

            var file = assetList[index].file;

            numDeleted++;
            if (isSkipDelete) {
                logger.info('Skipping delete of duplicate file: ' + file);
            } else {
                logger.info('Deleting duplicate file: ' + file);
                utils.deleteFile(file);
                utils.deleteFile(file.substring(0,file.lastIndexOf('/')));
            }
        }
    }

    return numDeleted;
}

function checkHash(assetHashes, md5Hashes, dxId) {
    var isFound = false;
    for (var key in  md5Hashes) {
        if (key === assetHashes[dxId].md5Hash) {

            // don't readd a file to the list of assets if it already exists
            if (md5Hashes[key][0].id !== dxId) {
                md5Hashes[key].push({'id': dxId, 'file': assetHashes[dxId].file});
            }
            isFound = true;
        }
    }
    return isFound;
}


function loadHashes(assetHashes, md5Hashes) {
    for (var dxId in assetHashes) {
        if (assetHashes.hasOwnProperty(dxId)) {
            var isFound = checkHash(assetHashes, md5Hashes, dxId);

            if (!isFound) {
                md5Hashes[assetHashes[dxId].md5Hash] = [{'id': dxId, 'file':assetHashes[dxId].file}];
            }
        }
    }
}


function removeDuplicateAssets(rootDir, skipDelete) {
    var deferred = Q.defer();

	var assetPath = rootDir + '/assets/dxdam/wcm';

	var isSkipDelete = false;
	if (skipDelete === 'true') {
	    logger.info('skipDelete is set to true, so duplicates will not be deleted.');
		isSkipDelete = true;
	}

	try {

		var fileList = utils.findFiles(assetPath);

		generateHashes(fileList)
		.then(function(assetHashes){  //jshint ignore: line

			var md5Hashes = {};
			
			if (fs.existsSync(rootDir + '/md5Hashes.json'))  {
				logger.info('Loading File: ' + rootDir + '/md5Hashes.json');
				md5Hashes = utils.loadJsonFile(rootDir + '/md5Hashes.json');
			} 

			loadHashes(assetHashes, md5Hashes);

			var duplicateAssets = {};

			if (fs.existsSync(rootDir + '/duplicateAssets.json'))  {
				logger.info('Loading File: ' + rootDir + '/duplicateAssets.json');
				duplicateAssets = utils.loadJsonFile(rootDir + '/duplicateAssets.json');
			} 

			// iterate each md5Hashes
			// iterate each list of ids
			// if the index is 0, add to dxassets with its own id 
			// if the index is > 0, add to dxassets the 0 id and delete its file

			var numDeleted = 0;


			for (var md5Hash in md5Hashes) {
			    if (md5Hashes.hasOwnProperty(md5Hash)) {
			        numDeleted += removeDuplicate(md5Hashes, md5Hash, duplicateAssets, isSkipDelete);
                }
			}

			// write dxassets to dxassets.json
            logger.info('Saving File: ' + rootDir + '/duplicateAssets.json');
			utils.saveJsonFile(duplicateAssets, rootDir + '/duplicateAssets.json');
            logger.info('Saving File: ' + rootDir + '/md5Hashes.json');
			utils.saveJsonFile(md5Hashes, rootDir + '/md5Hashes.json');

			if (numDeleted === 0) {
				logger.info('No duplicate assets were found.');
			} else if (isSkipDelete) {
			    logger.info('Number of duplicate files that were skipped: ' + numDeleted);
            } else {
                logger.info('Number of duplicate files that were deleted: ' + numDeleted);
            }
			deferred.resolve();

		})
		.fail(function(error){
			deferred.reject(error);
		});

	} catch (error) {
		deferred.reject(error);
	}
	return deferred.promise;

}

function generateHashes(fileList) {

    var deferred = Q.defer();
    var assetHashes = {};

    var promiseArray = [];

    for (var index = 0; index < fileList.length; index++) {
        var file = fileList[index];
        var promise = 	utils.createHash(file);
        promiseArray.push(promise);
    }

    Q.all(promiseArray)
	.then(function(md5HashArray){
	    for (var index = 0; index < md5HashArray.length; index++) {
	        var md5Hash = md5HashArray[index];
            var parts = fileList[index].split('/');
            var dxId = parts[parts.length-2];
            assetHashes[dxId] = {'file': fileList[index], 'md5Hash': md5Hash};
        }
        deferred.resolve(assetHashes);

	}).fail(function(error){
		deferred.reject(error);
	});

    return deferred.promise;
}

module.exports.main = removeDuplicateAssets;


