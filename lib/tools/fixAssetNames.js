/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */
var fs = require('fs'),
	utils = require('../utils/common'),
	Q = require('q');

const logger = require('../utils/loggerWinston');
const MAX_FILE_SIZE = 50000000;

function fixAssetNames(path) { // jshint ignore: line

    var deferred = Q.defer();

    try {

        var filelist = utils.findFiles(path);

        var isGlobalError = false;

        var promiseArray = [];

        var invalidImageFiles = [];

        for (var index = 0; index < filelist.length; index++) {

            var filePath = filelist[index];
            logger.debug('Checking file: ' + filePath);

            var parts = filePath.split('/');
            var fileName= parts[parts.length -1];

            var isLocalError = false;
            if (fileName[fileName.length-4] === '-') {
                isGlobalError = true;
                isLocalError = true;

                fileName = fileName.substring(0,fileName.length-4) + '.' + fileName.substring(fileName.length-3, fileName.length);
            }

            if (fileName.indexOf('%2B') >=0 ) {
                isGlobalError = true;
                isLocalError = true;
                fileName = fileName.replace(/%2B/g, '+');
            }

            if (fileName.indexOf('%2F') >=0 ) {
                isGlobalError = true;
                isLocalError = true;
                fileName = fileName.replace(/%2F/g, '_');
            }

            if (fileName.indexOf('.') === -1) {
                isGlobalError = true;
                isLocalError = true;

                fileName = fileName + '.nox';
            }

            var decodedFileName = decodeURI(fileName);
            if (decodedFileName !== fileName) {
                isGlobalError = true;
                isLocalError = true;
                fileName = decodedFileName;
            }

            if (isLocalError) {
                var newPath = '';

                for (var i = 0; i < parts.length-1; i++) {
                    newPath += parts[i] + '/';
                }

                newPath += fileName;

                logger.info('CHANGING TO: ' + newPath);

                try {
                    fs.renameSync(filePath, newPath);
                    filePath = newPath;
                } catch (error) {
                    logger.warn('File name could not be changed - will keep original file name ' + filePath);
                    logger.debug(error.message);
                    logger.debug(error.stack);
                }

            }

            if (utils.getFileSize(filePath) > MAX_FILE_SIZE) {

                logger.error('Deleting file which is larger than Max size of ' + MAX_FILE_SIZE + ' bytes: ' + filePath);
                utils.deleteFile(filePath);
                utils.deleteFile(filePath.substring(0,filePath.lastIndexOf('/')));
            }

            // if this is a bmp file convert to jpg
            var extension = filePath.substring(filePath.lastIndexOf('.')+1, filePath.length).toUpperCase();
            if (extension === 'BMP') {
                var promise = utils.convertToJPG(filePath);
                promiseArray.push(promise);
            } else if (utils.isInvalidImageFile(extension)) {
                invalidImageFiles.push(filePath);
                isGlobalError = true;
            }
        }

        if (!isGlobalError) {
            logger.info('No invalid filenames were found.');
        }

        Q.all(promiseArray)
            .then(function(invalidImageFiles) {
                for (var index = 0; index < invalidImageFiles.length; index++) {
                    utils.deleteFile(invalidImageFiles[index]);
                }
            }).then(function() {

            if (invalidImageFiles.length === 0) {
                deferred.resolve();
            } else {

                var invalidFilesMessage = 'The following image files are not supported by WCH and must be converted to JPG, GIF, PNG, or SVG or deleted before continuing:';
                for (var i = 0; i < invalidImageFiles.length; i++) {
                    invalidFilesMessage += '\n- ' + invalidImageFiles[i];
                }
                invalidFilesMessage += '\n\nNote: If deleting the invalid image files, make sure to delete its parent folder as well.';

                deferred.reject(new Error(invalidFilesMessage));
            }

        }).fail(function(error) {
            deferred.reject(error);
        });



    } catch (error) {
        deferred.reject(error);
    }
	return deferred.promise;
}


module.exports.main = fixAssetNames;


