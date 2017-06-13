/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 */

var fs = require("fs")
    , p = require('path')
    , Q = require('q')
    , crypto = require('crypto')
    , jimp = require('jimp')
;

const logger = require("./loggerWinston.js");


function cleanId (id) {
	// remove wcmrest: prefix from ids 
	if (id.indexOf(":") > -1) {
		id = id.substring(id.indexOf(':')+1);
	}
	
	return id;
	
}

function listContainsObject(obj, list) {

	var array = [];
	
	if (typeof list === "string") {
		array = list.split(",");
		
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

function getStringValue(fieldJson) {
	var result = "";
	if (fieldJson!= undefined) {
		if (typeof fieldJson == "string") {
			result = fieldJson;
		} else if (fieldJson.value != undefined && typeof fieldJson.value == "string") {
			result = fieldJson.value;
		}
	}
	
	return result;
}

function getResourceUriValue(fieldJson, type) {
	var result = "";
	
	if (fieldJson!= undefined) {
		if (type.toUpperCase() == "libraryImageComponent".toUpperCase()) {
			if (fieldJson.image.resourceUri != undefined) {
				result = fieldJson.image.resourceUri.value;
			}
		} else {
			if (fieldJson.resourceUri != undefined) {
				result = fieldJson.resourceUri.value;
			}
		}
	}

	return result;
}



function getLocaleValue(fieldJson) {
	var result = "en";
	if (fieldJson!= undefined) {
		if (typeof fieldJson != "string" && fieldJson.lang != undefined && typeof fieldJson.lang == "string") {
			result = fieldJson.lang;
		} else {
			logger.warn("Could not determine locale - setting to \"en\".")
			logger.debug(fieldJson);
		}
	}
	
	return result;
}


function createHash(file) {
	var deferred = Q.defer();
	
	var hash = crypto.createHash('md5');
	var stream = fs.createReadStream(file);
	
	stream.on('data', function(data) {
		hash.update(data, 'utf8')
	});
	
	stream.on('end', function() {
		deferred.resolve(hash.digest('hex'));
	});
	
	return deferred.promise;
}

function convertBmp(bmpFile) {

	if (bmpFile.substring(bmpFile.length-4, bmpFile.length).toUpperCase() == ".BMP") {
		var jpgFile =  bmpFile.substring(0, bmpFile.length-4) + ".jpg";

		jimp.read(bmpFile)
		.then(function(image) {
			logger.info("CONVERTING FILE: " + bmpFile);
			logger.info("CHANGING TO: " + jpgFile);

			image.write(jpgFile);
			
		})
		.then(function() {
			fs.unlinkSync(bmpFile);
		})
		.catch(function(error) {
			logger.error("Error converting file: " + bmpFile);
			logger.error(error.message);
		});		
	} 
}

function findByVal(map, val) {
	var result = undefined;
	
	for (var key in map) {
		if (map[key] == val) {
			result= key;
		} 
	}
	
	return result;
}

function indent(numSpaces) {
	var result = "";

	for (var i =0; i < numSpaces; i ++) {
		result+= " ";
	}
	
	return result;
}


function getNameValue(fieldJson) {
	var result = "";
	if (fieldJson!= undefined) {
		if (typeof fieldJson == "string") {
			result = fieldJson;
		} else if (fieldJson.distinguisedName != undefined && typeof fieldJson.distinguisedName == "string") {
			result = fieldJson.distinguisedName;
		}
	}
	
	return result;
}

function getTypeIdValue(fieldJson) {
	var result = "";

	for (var i = 0; i < fieldJson.length; i++) {
		if (fieldJson[i].rel == "content-template") {
			var contentTemplateUrl = fieldJson[i].href; 
			var parts = contentTemplateUrl.split('/');
			result = parts[parts.length-1];
		}
	}
	
	return result;
}

function getDateValue(fieldJson) {
	var result = "";
	
	var date = null;

	if (fieldJson == "") {
		date = new Date();
	} else {
		date = new Date(fieldJson); 
	}
	
	result = date.toISOString();

	return result;
}

function getStatusValue(fieldJson) {
	var result = "draft";
	
	if (fieldJson != undefined && fieldJson[0] != undefined && fieldJson[0].term != undefined) {
		 if (fieldJson[0].term.toUpperCase() =="PUBLISHED") {
			status = "ready";
		}
	}
	
	
	/* TODO: Get strings for expired docs */
	
	return result;
}


function getDxAssetId(uri) {
	
	var assetId = "";
	
	if (typeof uri == "object") {
		uri = JSON.stringify(uri);
	}
	
	logger.debug("URI: " + uri);
	
	if (uri != undefined) {
		
		var parts = uri.split('/');
		assetId = parts[parts.length-2];
		
	}
	
	return assetId;
}


var createPath = function (path) {
	
	var parts = path.split('/');

	var tempPath = "";
	
	for (var index in parts) {
		
		tempPath += parts[index] + "/";
		
		logger.debug("Checking path: " + tempPath);
		
		if (!fs.existsSync(tempPath)) {
			fs.mkdirSync(tempPath);	
		}
	}
}

var copyFile = function(source, copy) {
	fs.createReadStream(source).pipe(fs.createWriteStream(copy));
}

var getFilename = function(fullpath) {
	var result = "";
	var parts = fullpath.split('/');
	
	result= parts[parts.length-1];
	
	return result;
}



var loadJsonFile = function(jsonFilePath) {
	
	var jsonFile = {};
	
	try {
		jsonFile = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
	} catch(err) {
		
		logger.info("Could not parse file: " + jsonFilePath);
		
	}
	return jsonFile;
}

var saveJsonFile = function(json, jsonFilePath) {
	
	try {
		fs.writeFileSync(jsonFilePath, JSON.stringify(json, null, 4));
	} catch(err) {
		
		logger.error("Could not write file: " + jsonFilePath);
		
	}
	return;
}



var findFiles = function(dir, substr, filelist) {
	  if (filelist == null) 
		  filelist = [];

	  var files = fs.readdirSync(dir);

	  for (var index in files) {
		  var file = files[index];
		    if (fs.statSync(dir + '/' + file).isDirectory()) {
			      filelist = findFiles(dir + '/' + file, substr, filelist);
			    }
			    else {
			    	
			    	// if no substr is specified, then just add the file
			    	if (substr == undefined) {
			    		filelist.push(dir + '/' + file);

			    	// if an substr is specified, check that it contains the substr before adding	
			    	} else if (file.indexOf(substr) > -1) {
			    		filelist.push(dir + '/' + file);
			    	}
			    }
	  }
	  return filelist;
};

function findEmptyFolders(dir, filelist) {
	  if (filelist == null) 
		  filelist = [];

	  var files = fs.readdirSync(dir);
	  
	  if (files.length == 0) {
		  filelist.push(dir);
	  }

	  for (var index in files) {
		  var file = files[index];
		    if (fs.statSync(dir + '/' + file).isDirectory()) {
			      filelist = findEmptyFolders(dir + '/' + file, filelist);
			    }
	  }
	  return filelist;
};

function isEmpty(dir) {
	var result = true;
	
	var files = fs.readdirSync(dir);
	if (files.length) {
		result = false;
	}
	
	return result;
}



function getAssetPath(uri, dir, connectionId) {
	
	var start = uri.lastIndexOf("/") + 1;
	var end = uri.length; 
		
	if (uri.indexOf("?") > start) {
		end = uri.indexOf("?");
	}
		
	var filename = uri.substring(start,end);	

	var dxAssetId = getDxAssetId(uri);
	
	createPath(dir + "/" + connectionId + "/assets/dxdam/wcm/" + dxAssetId);

	return dir + "/" + connectionId + "/assets/dxdam/wcm/" + dxAssetId + "/" + filename;
}


function deleteWCHJson(path) {

	var filelist = findFiles(path);
	for (var index in filelist) {
		
		var filePath = filelist[index];
		if (filePath.endsWith("_amd.json") || filePath.endsWith("_tmd.json") || filePath.endsWith("_cmd.json")) {
			
			logger.info("DELETING FILE: " + filePath);
			fs.unlink(filePath);
		}
	}
}

function fixElementKey(key) {
	key = key.substring(0,50);  // max key length is 50 characters
    key = key.replace(/\ /g, '_');   // replace all spaces in key names as that is invalid for WCH
    key = key.replace(/\$/g, '_');   // replace all dollar signs in key names as that is invalid for WCH
    key = key.replace(/\!/g, '_');   // replace all exclamation points in key names as that is invalid for WCH
    key = key.replace(/\(/g, '_');   // replace all left paren in key names as that is invalid for WCH
    key = key.replace(/\)/g, '_');   // replace all right paren in key names as that is invalid for WCH
    key = key.replace(/\-/g, '_');   // replace all hyphen in key names as that is invalid for WCH
    key = key.replace(/\./g, '_');   // replace all periods in key names as that is invalid for WCH
	return key;
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

function genUniqueName(name, id, typeNames) {

	var result = name + ' ' + Math.floor(Math.random() * (9999 - 1000) + 1000);
	
	if (isUniqueName(result, typeNames)) {
		// add the new name to the name list
		typeNames[result] = id;
		 
	} else {
		// try to get another new unique name
		
		result = genUniqueName(name, id, typeNames);
	}
	
	// return the new name;
	return result ;
}
	

function isUniqueName(name, typeNames) {
	
	var isUnique = false;
	
	if (typeNames[name] == undefined) {
		isUnique = true;
	} 
	
	return isUnique;
	
}


function genNodeCommand(script, connectionId, dir, password, skipDelete) {
	var result = "node " + __dirname + "/" + script + " -connectionId " + connectionId;
	
	if (dir != undefined  && dir) {
		result += " -dir  \"" + dir + "\"";
	}

	if (password != undefined  && password) {
		result += " -password " + password;
	}
	
	if (skipDelete != undefined  && skipDelete) {
		result += " -skipDelete " + skipDelete;
	}
	

	
	return result;
}



function processArgs(args, minUnnamedParams, maxUnnamedParams, requiredParams, optionalParams) {

	var result = {};

	var isParamValueNext = false;
	var paramName = "";
	var unnamedParamCount = 0;
	
	if (minUnnamedParams == undefined) {
		minUnnamedParams = 0;
	}

	if (maxUnnamedParams == undefined) {
		maxUnnamedParams = 100;
	}

	if (requiredParams == undefined) {
		requiredParams = [];
	}
	
	for (var index in args) {
		
		var arg = args[index];
		if (index == 0 || index == 1) {
			//ignore the first two args

		} else {

			if (isParamValueNext) {
				result[paramName] = arg;
				isParamValueNext = false;
				paramName = "";
				
			} else if(arg.startsWith('-')) {
				
				
				isParamValueNext = true;
				paramName = arg.substring(1);
				
				if (result[paramName] != undefined) {
					throw new Error("Duplicate parametner specified: " +  paramName + ", value: " + result[paramName]);
				}
				
			} else {
				result["unnamedParam" + unnamedParamCount] = arg;
				unnamedParamCount++;
			} 
		}	
	}
	
	//verify the number of unnamed params
	if (unnamedParamCount > maxUnnamedParams  || unnamedParamCount < minUnnamedParams) {
		throw new Error("Invalid parameters specifed.")
	}
	
	// verify that all required params are specified
	for (var index in requiredParams) {
		var paramName = requiredParams[index];
		
		if (result[paramName] == undefined) {
			throw new Error("Required parameter not specified: " + paramName);
		}
	}
	
	
	//verify that all specified parameters are valid
	for (var paramName in result) {
		
		var isFound = false;
		
		if (paramName.startsWith("unnamedParam")) {
			isFound = true;
		}
		
		for (var index in requiredParams) {
			if (paramName == requiredParams[index]) {
				isFound = true;
			}
		}

		if (optionalParams == undefined) {
			isFound = true;
		} else {
			for (var index in optionalParams) {
				if (paramName == optionalParams[index]) {
					isFound = true;
				}
			}
		}

		if (!isFound) {
			throw new Error("Invalid parameter specfied: " + paramName);
		}
	}
	
	return result; 
}

module.exports.cleanId = cleanId;
module.exports.getStringValue = getStringValue;
module.exports.getLocaleValue = getLocaleValue;
module.exports.createHash = createHash;
module.exports.convertBmp = convertBmp;
module.exports.getNameValue = getNameValue;
module.exports.getTypeIdValue = getTypeIdValue;
module.exports.getDateValue = getDateValue;
module.exports.getStatusValue = getStatusValue;
module.exports.getResourceUriValue = getResourceUriValue;
module.exports.getDxAssetId = getDxAssetId;
module.exports.getAssetPath = getAssetPath;
module.exports.createPath = createPath;
module.exports.deleteFile = deleteFile;
module.exports.copyFile = copyFile;
module.exports.getFilename = getFilename;
module.exports.loadJsonFile = loadJsonFile;
module.exports.saveJsonFile = saveJsonFile;
module.exports.findFiles = findFiles;
module.exports.findEmptyFolders = findEmptyFolders;
module.exports.isEmpty = isEmpty;
module.exports.deleteWCHJson = deleteWCHJson;
module.exports.genUniqueName = genUniqueName;
module.exports.isUniqueName = isUniqueName;
module.exports.fixElementKey = fixElementKey;
module.exports.genNodeCommand = genNodeCommand;
module.exports.findByVal = findByVal;
module.exports.processArgs = processArgs;
module.exports.listContainsObject = listContainsObject;
module.exports.indent = indent;

