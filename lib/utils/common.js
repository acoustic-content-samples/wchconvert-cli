/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

const logger = require('./loggerWinston');

var fs = require('fs'),
    Q = require('q'),
    crypto = require('crypto'),
    jimp = require('jimp');



function listContainsObject(obj, list) {

    var array = [];

    if (typeof list === 'string') {
        array = list.split(',');

    } else {
        array = list;
    }

    for (var i = 0; i < array.length; i++) {
        if (array[i].toUpperCase().trim() === obj.toUpperCase().trim() ) {
            return true;
        }
    }

    return false;
}

function loadSettings(args) {  // jshint ignore : line

    var connectionId = '';
    var settingsFileName = './settings.json';
    var password;
    var lastModified;
    var rootWorkspace;

    if (args.connectionId !== undefined) {
        connectionId = args.connectionId;
    }

    if (args.dir !== undefined) {
        rootWorkspace = args.dir;
        settingsFileName = rootWorkspace + '/settings.json';
    }

    if (args.settings !== undefined) {
        settingsFileName = args.settings;
    } else {
        args.settings = settingsFileName;
    }

    if (args.password !== undefined) {
        password = args.password;
    }

    if (args.lastModified !== undefined) {
        lastModified = args.lastModified;
    }

    var settingsListJSON = [];

    try {
        settingsListJSON = JSON.parse(fs.readFileSync(settingsFileName, 'utf8'));

    } catch (error) {
        logger.error('Error parsing settings file: ' + settingsFileName + ': ' + error.message);
    }

    var index = -1;
    for (var i = 0; i < settingsListJSON.length; i++) {
        if (connectionId === settingsListJSON[i].connectionId) {
            index = i;
        }
    }

    var settingsJSON;
    if (index !== -1) {
        settingsJSON = settingsListJSON[index];
        if (password !== undefined) {
            settingsJSON.password = password;
        }

        if (lastModified !== undefined) {
            settingsJSON.lastModified = lastModified;
        }
        if (rootWorkspace === undefined) {
            settingsJSON.ROOT_WORKSPACE = '.';
        } else {
                settingsJSON.ROOT_WORKSPACE = rootWorkspace;
        }
    }

    return settingsJSON;
}


function createPath (path) {

    var parts = path.split('/');

    var tempPath = '';

    for (var index = 0; index < parts.length; index++) {

        tempPath += parts[index] + '/';

        logger.debug('Checking path: ' + tempPath);

        if (!fs.existsSync(tempPath)) {
            fs.mkdirSync(tempPath);
        }
    }
}

function copyFile (source, copy) {
    fs.createReadStream(source).pipe(fs.createWriteStream(copy));
}

function getFilename (fullpath) {
    var result;
    var parts = fullpath.split('/');

    result= parts[parts.length-1];

    return result;
}

function exists(path) {
    return fs.existsSync(path);
}

function loadJsonFile(jsonFilePath) {
    var result;

    try {
        if (fs.existsSync(jsonFilePath)) {
            result = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
        }
    } catch(err) {
        logger.info('Could not parse file: ' + jsonFilePath);
    }

    if (typeof result === 'string') {
        result = JSON.parse(result);
    }

    return result;
}

function saveJsonFile (json, jsonFilePath, isOverride) {

    if (isOverride === undefined) {
        isOverride = true;
    }

    try {

        if (isOverride  || !fs.existsSync(jsonFilePath)) {
            fs.writeFileSync(jsonFilePath, JSON.stringify(json, null, 4));
        }

    } catch(err) {

        logger.error('Could not write file: ' + jsonFilePath);

    }

}

function getFileSize(filepath) {
    var stats = fs.statSync(filepath);
    return stats.size;
}

function findFiles(dir, substr, filelist) {
    if (filelist === undefined) {
        filelist = [];
    }

    var files = fs.readdirSync(dir);

    for (var index = 0; index < files.length; index++) {
        var file = files[index];
        if (fs.statSync(dir + '/' + file).isDirectory()) {
            filelist = findFiles(dir + '/' + file, substr, filelist);
        }
        else {

            // if no substr is specified, then just add the file
            if (substr === undefined) {
                filelist.push(dir + '/' + file);

                // if an substr is specified, check that it contains the substr before adding
            } else if (file.indexOf(substr) > -1) {
                filelist.push(dir + '/' + file);
            }
        }
    }
    return filelist;
}

function findEmptyFolders(dir, filelist) {
    if (filelist === undefined) {
        filelist = [];
    }

    var files = fs.readdirSync(dir);

    if (files.length === 0) {
        filelist.push(dir);
    }

    for (var index = 0; index < files.length; index++) {
        var file = files[index];
        if (fs.statSync(dir + '/' + file).isDirectory()) {
            filelist = findEmptyFolders(dir + '/' + file, filelist);
        }
    }
    return filelist;
}

function isEmpty(dir) {
    var result = true;

    var files = fs.readdirSync(dir);
    if (files.length) {
        result = false;
    }

    return result;
}

function deleteFile(path) {
    if (fs.existsSync(path)) {
        var stat = fs.statSync(path);
        if (stat.isFile()) {
            fs.unlinkSync(path);
        } else if (stat.isDirectory()) {
            fs.rmdirSync(path);
        }
    }
}

function createHash(file) {
    var deferred = Q.defer();

    var hash = crypto.createHash('md5');
    var stream = fs.createReadStream(file);

    stream.on('data', function(data) {
        hash.update(data, 'utf8');
    });

    stream.on('end', function() {
        deferred.resolve(hash.digest('hex'));
    });

    return deferred.promise;
}

function convertToJPG(imageFile) {
    var deferred = Q.defer();
        var extension = imageFile.substring(imageFile.length - 4, imageFile.length).toUpperCase();

        if (extension === '.BMP' || extension === '.PNG') {
            var jpgFile = imageFile.substring(0, imageFile.length - 4) + '.jpg';

            jimp.read(imageFile)
                .then(function (image) {
                    logger.info('CONVERTING FILE: ' + imageFile);
                    logger.info('CHANGING TO: ' + jpgFile);

                    image.write(jpgFile);
                    deferred.resolve(imageFile);

                })
                .catch(function (error) {
                    error.message = 'Error converting file: ' + imageFile + ': ' + error.message;
                    deferred.reject(error);
                });
        }

        return deferred.promise;
}

function findByVal(map, val) {
    var result;

    for (var key in map) {
        if (map.hasOwnProperty(key)) {
            if (map[key] === val) {
                result= key;
            }
        }
    }

    return result;
}

function indent(numSpaces) {
    var result = '';

    for (var i =0; i < numSpaces; i ++) {
        result+= ' ';
    }

    return result;
}


function genNodeCommand(script, connectionId, dir, password, skipDelete) {
    var result = 'node ' + __dirname + '/' + script + ' -connectionId ' + connectionId;

    if (dir  !== undefined  && dir) {
        result += ' -dir  \"' + dir + '\"';
    }

    if (password  !== undefined  && password) {
        result += ' -password ' + password;
    }

    if (skipDelete  !== undefined  && skipDelete) {
        result += ' -skipDelete ' + skipDelete;
    }



    return result;
}


function processArgs(args, minUnnamedParams, maxUnnamedParams, requiredParams, optionalParams) { // jshint ignore: line

    var result = {};

    var isParamValueNext = false;
    var paramName;
    var unnamedParamCount = 0;
    var index;

    if (minUnnamedParams === undefined) {
        minUnnamedParams = 0;
    }

    if (maxUnnamedParams === undefined) {
        maxUnnamedParams = 100;
    }

    if (requiredParams === undefined) {
        requiredParams = [];
    }

    for (index = 0; index < args.length; index ++) {

        var arg = args[index];
        if (index > 1) {
            //ignore the first two args

            if (isParamValueNext) {
                result[paramName] = arg;
                isParamValueNext = false;
                paramName = '';

            } else if(arg.startsWith('-')) {


                isParamValueNext = true;
                paramName = arg.substring(1);

                if (result[paramName]  !== undefined) {
                    throw new Error('Duplicate parametner specified: ' +  paramName + ', value: ' + result[paramName]);
                }

            } else {
                result['unnamedParam' + unnamedParamCount] = arg;
                unnamedParamCount++;
            }
        }
    }

    //verify the number of unnamed params
    if (unnamedParamCount > maxUnnamedParams  || unnamedParamCount < minUnnamedParams) {
        throw new Error('Invalid parameters specifed.');
    }

    // verify that all required params are specified
    for (index = 0; index < requiredParams.length; index ++) {
        paramName = requiredParams[index];

        if (result[paramName] === undefined) {
            throw new Error('Required parameter not specified: ' + paramName);
        }
    }

    //verify that all specified parameters are valid
    for (paramName in result) {
        if (result.hasOwnProperty(paramName)) {

            var isFound = false;

            if (paramName.startsWith('unnamedParam')) {
                isFound = true;
            } else if (requiredParams.indexOf(paramName) > -1) {
                isFound = true;
            } else if (optionalParams !== undefined && optionalParams.indexOf(paramName) > -1) {
                isFound = true;
            }

            if (!isFound) {
                throw new Error('Invalid parameter specfied: ' + paramName);
            }
        }
    }

    return result;
}

const invalidImageExtensions = ['JFIF', 'EXIF', 'TIFF', 'PPM', 'PGM', 'PBM', 'PNM'];

function isInvalidImageFile(extension) {
    logger.info('checking extension: ' + extension);
    return invalidImageExtensions.indexOf(extension) > -1;
}

function safeJSONParse(jsonString) {  //jshint ignore:line
    try {

        var json = JSON.parse(jsonString);
        return json;

    } catch (error) {
        if (error.constructor === SyntaxError) {

            var isInvalidAscii = false;

            logger.warn('Received SyntaxError parsing JSON: ' + error.message);

            logger.warn('Searching for invalid characters.');
            var result = '';


            for (var i = 0; i < jsonString.length; i++) {

                var asciiValue = jsonString.charCodeAt(i);

                if ( asciiValue < 32 || asciiValue === 127) {
                    logger.warn('Removing invalid character at position ' + i + ' with ascii value: ' + asciiValue);
                    isInvalidAscii = true;

                } else {
                    result += jsonString.charAt(i);
                }
            }

            if (isInvalidAscii) {
                logger.warn('Finished removing invalid characters. Reattempting to parse JSON String.');
                return (safeJSONParse(result));
            } else {
                throw error;
            }
        } else {
            throw error;
        }
    }
}


module.exports = {
    loadSettings: loadSettings,
    createPath: createPath,
    createHash: createHash,
    convertToJPG: convertToJPG,
    exists: exists,
    deleteFile: deleteFile,
    copyFile: copyFile,
    getFilename: getFilename,
    loadJsonFile: loadJsonFile,
    saveJsonFile: saveJsonFile,
    getFileSize: getFileSize,
    findFiles: findFiles,
    isEmpty: isEmpty,
    genNodeCommand: genNodeCommand,
    findByVal: findByVal,
    processArgs: processArgs,
    findEmptyFolders: findEmptyFolders,
    listContainsObject: listContainsObject,
    indent: indent,
    isInvalidImageFile: isInvalidImageFile,
    safeJSONParse: safeJSONParse

};