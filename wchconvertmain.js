/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

/*
 * 
 * 

Usage:

wchconvert pull -connectionId <connectionId> [-dir <dir> -wcmPassword <wcm password>]
wchconvert prepareAssets -connectionId <connectionId> [-dir <dir>]
wchconvert pushAssets -connectionId <connectionId> [-dir <dir> -wchPassword <wch password>]
wchconvert analyze -connectionId <connectionId> [-dir <dir>]
wchconvert convert -connectionId <connectionId> [-dir <dir>]
wchconvert pushTypes -connectionId <connectionId> [-dir <dir> -wchPassword <wch password>]
wchconvert pushContent -connectionId <connectionId> [-dir <dir> -wchPassword <wch password>]

 */

var utils = require('./lib/utils/common'),
	wchtools = require('./lib/tools/wchTools'),
  	wchconvConst = require('./lib/utils/constants'),
    dxextract = require('./lib/main/dxextract').main,
    dxanalyze = require('./lib/main/dxanalyze').main,
    dxtransform = require('./lib/main/dxtransform').main,
    findMissingAssets = require('./lib/tools/findMissingAssets').main,
    fixAssetNames = require('./lib/tools/fixAssetNames').main,
    removeDuplicateAssets = require('./lib/tools/removeDuplicateAssets').main,
    Q = require('q');

const logger = require('./lib/utils/loggerWinston');

var args = [];

var wchconvertUsage = 'Usage: wchconvert <command> -connectionId <connectionId> [-wcmPassword <Portal WCM password> -wchPassword <WCH password> -dir <dir>]';
var commandsUsage = 'Commands:';
var pullUsage = 'pull\t\tConnects to Portal Server and downloads content, types, and assets.';
var prepareAssetsUsage = 'prepareAssets\tVerifies all assets are downloaded, fixes asset names, and removes duplicate assets.';
var pushAssetsUsage = 'pushAssets\t\tPushes assets to WCH with wchtools.';
var analyzeUsage = 'analyze\t\tProvides information on type and content to assist conversion process.';
var convertUsage = 'convert\t\tConverts WCM content and types to the WCH format.';
var pushTypesUsage = 'pushTypes\t\tPushes types to WCH with wchtools.';
var pushContentUsage = 'pushContent\t\tPushes content to WCH with wchtools.';

var optionsUsage = 'Options:';
var connectionIdUsage = '-connectionId\tA user-defined name to describe the Portal Server connection in the settings.json.';
var wcmPasswordUsage = '-wcmPassword\t\t[Optional] For pull, the password for Portal WCM. If not specified, wchconvert will look for the Portal WCM password in the settings.json.';  // jshint ignore:line
var wchPasswordUsage = '-wchPassword\t\t[Optional] For push commands, the password for WCH. If not specified, wchconvert will prompt for the password during the push commands.';  // jshint ignore:line
var dirUsage = '-dir\t\t[Optional] Path where the settings.json is located and where wchconvert will download the portal artifacts and create the converted artifacts. If not specified, wchconvert will look for the settings.json in the current directory and output to the current directory.' // jshint ignore:line

var realFs = require('fs');
var gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(realFs);

function printUsage() {
	var usage = '\n';
	usage += '  ' + wchconvertUsage + '\n\n';
	usage += '  ' + commandsUsage + '\n\n';
	usage += '    ' + pullUsage + '\n';
	usage += '    ' + prepareAssetsUsage + '\n';
	usage += '    ' + pushAssetsUsage + '\n';
	usage += '    ' + analyzeUsage + '\n';
	usage += '    ' + convertUsage + '\n';
	usage += '    ' + pushTypesUsage + '\n';
	usage += '    ' + pushContentUsage + '\n\n';
	usage += '  ' + optionsUsage + '\n\n';
	usage += '    ' + connectionIdUsage + '\n';
    usage += '    ' + wcmPasswordUsage + '\n';
    usage += '    ' + wchPasswordUsage + '\n';
	usage += '    ' + dirUsage + '\n';
	
	logger.info(usage);
}

function main(args) {  // jshint ignore: line

    logger.info('Starting wchconvert version ' + wchconvConst.VERSION);

    if (process.argv.length === 3 && ((process.argv[2] === 'help') || (process.argv[2] === '-help'))) {
        printUsage();
        process.exit(0);
    }

    try {
        args = utils.processArgs(process.argv, 1, 1, ['connectionId'], ['wchPassword', 'wcmPassword', 'dir', 'skipEmptyCheck', 'skipDelete']);
    } catch (err) {
        logger.error(err.message);
        printUsage();
        process.exit(-1);
    }

    processCommand(args)
        .then(function(message){
            logger.info(message);
            logger.info('WCHCONVERT COMPLETED SUCCESSFULLY');
        }).fail(function(error) {
            processError(error);
    });

}

function processCommand(args) {  //jshint ignore: line
    var deferred = Q.defer();

    var mode = args.unnamedParam0;
    var connectionId = args.connectionId;

    var dir = '.';
    if (args.dir !== undefined) {
        dir = args.dir;
    }

    var wchPassword;
    if (args.wchPassword !== undefined) {
        wchPassword = args.wchPassword;
    }
    var wcmPassword;
    if (args.wcmPassword !== undefined) {
        wcmPassword = args.wcmPassword;
    }

    var skipEmptyCheck = '';
    if (args.skipEmptyCheck !== undefined) {
        skipEmptyCheck = args.skipEmptyCheck;
    }

    var skipDelete = '';
    if (args.skipDelete !== undefined) {
        skipDelete = args.skipDelete;
    }

    var rootPath = dir + '/' + connectionId;
    var assetPath = dir + '/' + connectionId + '/assets/dxdam/wcm';

    logger.info('MODE: ' + mode);

    if (mode === 'pull') {
        dxextract(args)
            .then(function(message){
                deferred.resolve(message);
            }).fail(function(error){
            logger.error('WCHCONVERT PULL FAILED');
            deferred.reject(error);
        });

    } else if (mode === 'prepareAssets') {

        findMissingAssets(assetPath)
            .then(function() {
                return fixAssetNames(assetPath, skipEmptyCheck);
            }).then(function(){
                return removeDuplicateAssets(rootPath, skipDelete);
            }).then(function(){
              deferred.resolve('WCHCONVERT PREPARE ASSETS COMPLETED SUCCESSFULLY');
            }).fail(function(error){

            deferred.reject(error);
        });

    } else if (mode === 'pushAssets') {
        wchtools.pushAssets(dir + '/' + connectionId, wchPassword)
            .then(function(){
                deferred.resolve('WCHCONVERT PUSH ASSETS COMPLETED SUCCESSFULLY');
            }).fail(function(error){
            logger.error('WCHCONVERT PUSH ASSETS FAILED');
            deferred.reject(error);
        });

    } else if (mode === 'analyze') {

        dxanalyze(args)
            .then(function(message){
                deferred.resolve(message);
            }).fail(function(error){
            logger.error('WCHCONVERT ANALYZE FAILED');
            deferred.reject(error);
        });

    } else if (mode === 'convert') {
        dxtransform(args)
            .then(function(message){
                deferred.resolve(message);
            }).fail(function(error){
            logger.error('WCHCONVERT CONVERT FAILED');
            deferred.reject(error);
        });

    } else if (mode === 'pushTypes') {
        wchtools.pushTypes(dir + '/' + connectionId, wchPassword)
            .then(function(){
                deferred.resolve('WCHCONVERT PUSH TYPES COMPLETED SUCCESSFULLY');
            }).fail(function(error){
            logger.error('WCHCONVERT PUSH TYPES FAILED');
            deferred.reject(error);
        });


    } else if (mode === 'pushContent') {
        wchtools.pushContent(dir + '/' + connectionId, wchPassword)
            .then(function(){
                deferred.resolve('WCHCONVERT PUSH CONTENT COMPLETED SUCCESSFULLY');
            }).fail(function(error){
                logger.error('WCHCONVERT PUSH CONTENT FAILED');
                deferred.reject(error);
        });


    } else {
        deferred.reject(new Error('Invalid mode specified.'));
    }

    return deferred.promise;
}


function processError(error) { //jshint ignore: line
    logger.error('WCHCONVERT FAILED WITH ERRORS:');

    if (error instanceof Error) {

        if (error.message.includes('ECONNREFUSED')) {
            logger.error('- Failed to connect to Portal Server.');
            logger.error('- Verify connection info and that the Portal Server is running.');
            logger.debug(error.message);
            logger.debug(error.stack);

        } else if (error.status !== undefined) {
            logger.error(error.message + ', exit code: ' + error.status);
            logger.debug(error.stack);
            logger.error('Additional information from wchtools can be found in the wchtools-cli.log and wchtools-api.log.');

        } else {
            logger.error(error.message);
            logger.debug(error.stack);
        }

    } else if (error instanceof Array) {
        if (error.length === 1) {
            logger.error('wchtools  returned 1 error message:');
        } else {
            logger.error('wchtools  returned ' + error.length + ' error messages:');
        }

        for (var i = 0; i < error.length; i++) {
            logger.error('Error [' + i + ']: ' + error[i]);
        }
        logger.error('Additional information from wchtools can be found in the wchtools-cli.log and wchtools-api.log.');
    }
}

try {
    main(args);
} catch (error) {
    logger.error(error.message);
    logger.debug(error.stack);
}

