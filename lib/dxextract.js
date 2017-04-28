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
	, authRequest = require('./wcm-authenticated-request.js')
	, dxUtils = require("./dxUtils.js")
	, Q = require('q')
;

const logger = require("./loggerWinston.js");


//URI VARIALBES
var uriQueryLibraries = "/wcmrest/query?type=Library&pagesize=1000"
	, uriGetItem = "/wcmrest/item/"
	, uriGetContent = "/wcmrest/content/"
	, uriGetContentTemplate = "/wcmrest/contenttemplate/"
	, uriContentTemplateElements = "/Prototype/elements"
	, uriGetImage = "/wcmrest/libraryimagecomponent/"
	, uriGetFile = "/wcmrest/libraryfilecomponent/"
;

// type variables
var typeContent = "content"
	, typeContentTemplate = "contentTemplate"
	, typeImage = "libraryImageComponent"
	, typeFile = "libraryFileComponent"
;


// PATH VARIABLES:
//path structure is ./dir/<connection-id>/content/<library-id>/<content-id>_cdx.json
//                  ./dir/<connection-id>/types/<type-id>_tdx.json

var dir = "dir"
	, contentPath = "content"
	, contentTemplatePath = "types"
	, assetPath = "assets/dxdam/wcm"
	, dxAssetJsonPath = "dxAssetJson"
;

var init = function(args) {
	
	var connectionId = "";
	var settings = "settings.json";
	var password = undefined;
	var lastModified = undefined;
	
	
	if (args["connectionId"] != undefined) {
		connectionId = args["connectionId"];
	}

	if (args["dir"] != undefined) {
		dir = args["dir"];
		settings = dir + "/settings.json";
	}

	if (args["settings"] != undefined) {
		settings = args["settings"];
	} else {
		args["settings"]  = settings;
	}

	if (args["password"] != undefined) {
		password = args["password"];
	}

	if (args["lastModified"] != undefined) {
		lastModified = args["lastModified"];
	}

	var settingsListJSON = JSON.parse(fs.readFileSync(settings, 'utf8')); 
	
	var index = -1;
	for (var i = 0; i < settingsListJSON.length; i++) {
		if (connectionId == settingsListJSON[i].connectionId) {
			index = i;
		}
	}

	var settingsJSON = undefined;
	if (index != -1) {
		settingsJSON = settingsListJSON[index];
		
		if (password != undefined) {
			settingsJSON["password"] = password;	
		}
		
		if (lastModified != undefined) {
			settingsJSON["lastModified"] = lastModified;	
		}

		dxUtils.createPath(dir + "/" + connectionId + "/" + contentPath);
		dxUtils.createPath(dir + "/" + connectionId + "/" + contentTemplatePath);
		dxUtils.createPath(dir + "/" + connectionId + "/" + assetPath);
		dxUtils.createPath(dir + "/" + connectionId + "/" + dxAssetJsonPath);
	}
	
	return settingsJSON;
}

var initLibraryPath = function(connectionId, libraryId) {
	
	dxUtils.createPath(dir + "/" + connectionId + "/" + contentPath + "/" + libraryId);

	return;
}

function genContentPath(connectionId, libraryId, id) {
	// ./dir/<connection-id>/content/<library-id>/<content-id>_cdx.json
	var	result =  dir + "/" + connectionId + "/" + contentPath + "/" + libraryId + "/" + id + "_cdx.json"
	
	return result;
}


var genContentTemplatePath = function(connectionId, id) {
    //                  ./dir/<connection-id>/types/<type-id>_tdx.json
	var result =  dir + "/" + connectionId + "/" + contentTemplatePath + "/" + id + "_tdx.json"

	return result;
}


function genAssetJsonPath(connectionId, id) {
    //                  ./dir/<connection-id>/dxAssetJson/<dxasset-id>_adx.json
	var	result =  dir + "/" + connectionId + "/" + dxAssetJsonPath + "/" + id + "_adx.json"
	
	return result;
}


function getContentJson(id, title, dxPath, i) {
	var deferred = Q.defer();

	var uri = uriGetContent + id;

	if (fs.existsSync(dxPath)) {
		
		logger.info("Content already downloaded [" + i + "]: " + title + " [" + id + "]: "+ dxPath);
		
		var dxJson = JSON.parse(fs.readFileSync(dxPath, 'utf8'))
		
		deferred.resolve(dxJson);
		

	} else {
		
		logger.info("Downloading content [" + i + "]: " + title + " [" + id + "]"); 

		authRequest.getJson(uri)
		.then(function(contentString) {

			var dxJson = JSON.parse(contentString);

			deferred.resolve(dxJson.entry);
		})
		.fail(function(err) {
			logger.info("ERROR: " + err);
			logger.info(err.stack);
			deferred.reject(err);
		});

	}

	return deferred.promise;
}

function getContentTemplateJson(id, dxPath, i) {
	var deferred = Q.defer();
	
	var uri = uriGetContentTemplate + id;
	var uriElements = uri + uriContentTemplateElements;
	var result = undefined;
	
	if (fs.existsSync(dxPath)) {
		
		logger.info("Type already downloaded [" + i + "]: " + dxPath);

		var dxJson = JSON.parse(fs.readFileSync(dxPath, 'utf8'))
		
		deferred.resolve(dxJson);
	
	} else {

		logger.info("Downloading type [" + i + "]: " + id);
		
		authRequest.getJson(uri)
		.then(function(contentTemplateString) {
			
			var dxJson = JSON.parse(contentTemplateString);
			
			authRequest.getJson(uriElements)
			.then(function(elementsString) {
				
				var elementsJson = JSON.parse(elementsString);
				
				dxJson.entry["elements"] = elementsJson.feed.entry;
			})
			.then(function() {
				deferred.resolve(dxJson.entry);	
			})
		})
		.fail(function(err) {
			logger.info("ERROR: " + err);
			logger.info(err.stack);
			deferred.reject(err);
		});
		
	}
	
	
	
	return deferred.promise;
	
}


function getContentByPage(dxListJson, connectionId, libraryId, i, todoList) {
	 var deferred = Q.defer();

	if (i >= 0) {
		
		var id = dxUtils.cleanId(dxListJson[i].id)
		var title = dxUtils.getStringValue(dxListJson[i].title);
		
		logger.debug("Processing content [" + i + "]: " + title + " ["+ id + "]"); 

		var dxPath = genContentPath(connectionId, libraryId, id);
		
		logger.debug("PATH[" + i + "]: " + dxPath);
		
		getContentJson(id, title, dxPath, i)
		
		.then(function(contentJson) {
			
			if (!fs.existsSync(dxPath)) {
				fs.writeFileSync(dxPath, JSON.stringify(contentJson, null, 4));	
			}
			
			logger.debug("Title: " + contentJson.title.value);
			
   			var linkArray  = contentJson.link; 
   			var typeId = dxUtils.getTypeIdValue(contentJson.link);

   			// check the type id and add it to the list of types
   			if (typeId != "") {
   				logger.debug("Type ID: " + typeId);
    				
   				var isFound = false;
   				for (var i =0; i < todoList["types"].length; i++) {
   					if (typeId == todoList["types"][i]) {
   						isFound = true;
   					}
   				}
    				
   				if (!isFound) {
   					todoList["types"].push(typeId);	
   				}
   				
   			} else {
   				logger.error("typeid not found for " + itemId);
   			}
   			
   			
   			// check the elements and make list of images and files that will need to be downloaded
   			
   			var elements = contentJson.content.content.elements.element;
   			
   			for (var index in elements) {
   				
   				var element = elements[index];
   				
   				var type = element["type"];
   				
   				if (type == "FileComponent") {
   					
   					
   					if (element["data"]["resourceUri"] != undefined && element["data"]["resourceUri"]["value"] != undefined) {
   	   					// download the file
   	   					logger.debug("File resourceUri:" + element["data"]["resourceUri"]["value"]);
   	   					todoList["assets"].push(element["data"]["resourceUri"]["value"]);
   						
   					} else {
   						logger.debug("Content contains file reference without a resourceUri: " + id);
   					}
   		
   				}
   				
  				
   				if (type == "ImageComponent") {
   					
   					if (element["data"]["image"]["resourceUri"] != undefined && element["data"]["image"]["resourceUri"]["value"] != undefined) {
   	   					// download the image
   	   					logger.debug("image resourceUri:" + element["data"]["image"]["resourceUri"]["value"]);
   	   					
   	   					todoList["assets"].push(element["data"]["image"]["resourceUri"]["value"]);
   						
   					} else {
   						logger.debug("Content contains image reference without a resourceUri: " + id);
   					}
   				}
   				
   			}
		})
		.then(function() {
		
			deferred.resolve(getContentByPage(dxListJson, connectionId, libraryId, i-1, todoList));
			
		})
	    .fail(function(err) {
	        logger.debug("ERROR: " + err.message);
	        logger.debug("ERROR: " + err.stack);
	        deferred.reject(err);
	    });
		
	} else {
		
		logger.debug("completed getContentByPage recursion - length: " + dxListJson.length);
		deferred.resolve(dxListJson);
	}

	return deferred.promise;
}


function getAssetJsonByPage(dxListJson, connectionId, libraryId, i, todoList) {
	var deferred = Q.defer();

	if (i >= 0) {

		var id = dxUtils.cleanId(dxListJson[i].id);
		var title = dxUtils.getStringValue(dxListJson[i].title);
		var type = dxListJson[i].type;

		var assetJsonPath = genAssetJsonPath(connectionId, id);

		if (fs.existsSync(assetJsonPath)) {

			logger.info("Asset json already downloaded: " + assetJsonPath);

			var dxJson = dxUtils.loadJsonFile(assetJsonPath);
			var assetUri = dxUtils.getResourceUriValue(dxJson.content, type);

			logger.debug("Found asset: " + assetUri);

			var isFound = false;
			for (var c =0; c < todoList["assets"].length; c++) {
				if (assetUri == todoList["assets"][c]) {
					isFound = true;
					logger.debug("already added: " + assetUri);
				}
			}

			if (assetUri == "") {
				logger.warn("Asset has no file associated: " + id);

			} else if (!isFound) {
				logger.info("Adding asset to download list: " + assetUri);
				todoList["assets"].push(assetUri);	
			}

			deferred.resolve(getAssetJsonByPage(dxListJson, connectionId, libraryId, i-1, todoList));

		} else {


			logger.info("Downloading asset json [" + i + "]: " + title + "(" + id + ")"); 
			var uri = "/wcmrest/" +  dxListJson[i].type + "/" + id;

			authRequest.getJson(uri)
			.then(function(assetString) {
				var dxJson = JSON.parse(assetString).entry;

				var assetUri = dxUtils.getResourceUriValue(dxJson.content, type);

				logger.debug("Found asset: " + assetUri);
				dxUtils.saveJsonFile(dxJson, assetJsonPath);

				var isFound = false;
				for (var c =0; c < todoList["assets"].length; c++) {
					if (assetUri == todoList["assets"][c]) {
						isFound = true;
						logger.debug("already added: " + assetUri);
					}
				}

				if (assetUri == "") {
					logger.warn("Asset has no file associated: " + id);

				} else if (!isFound) {
					logger.info("Adding asset: " + assetUri);
					todoList["assets"].push(assetUri);	
				}

			})
			.then(function() {
				deferred.resolve(getAssetJsonByPage(dxListJson, connectionId, libraryId, i-1, todoList));
			})
			.fail(function(err) {
				logger.debug("ERROR: " + err.message);
				logger.debug("ERROR: " + err.stack);
				deferred.reject(err);
			});
		}

		

	} else {

		logger.debug("completed getAssetJsonByPage recursion - length: " + dxListJson.length);
		deferred.resolve(dxListJson);
	}

	return deferred.promise;
}


function getLibraryItems(librariesJson, connectionId, findLibraryName, type, libraryIndex, page, todoList) {
	 var deferred = Q.defer();
	
	 var currentLibraryIndex = libraryIndex;
	 var currentPage = page;
	 
	 logger.debug("running getLibraryItems " + currentLibraryIndex + ":" + currentPage + " - " + type);
	 
	 if (todoList['libraries'] == undefined) {
		 todoList['libraries'] = {};
	 } 
	 
	 
	if (libraryIndex >= 0) {

		var libraryId = dxUtils.cleanId(librariesJson[libraryIndex].id);
		
		var libraryName = "";
		
		
		if (librariesJson[libraryIndex].title != undefined) {
			libraryName = dxUtils.getStringValue(librariesJson[libraryIndex].title).toUpperCase();	
		} else {
			libraryName = libraryId;
		}

		todoList['libraries'][libraryId] = libraryName;
		
        var systemLibraries = ["BLOG SOLO TEMPLATE V70", 
                               "BLOG TEMPLATE V70",
                               "SITE BUILDER TEMPLATE LIBRARY",
                               "SOCIAL LISTS 1.0",
                               "TEMPLATE PAGE CONTENT 3.0",
                               "WEB CONTENT TEMPLATES 3.0",
                               "WEB RESOURCES V70" ];

        var systemLibrary = false;
        systemLibrary = dxUtils.listContainsObject(libraryName,systemLibraries);

		if ( (findLibraryName == undefined || findLibraryName == "" || dxUtils.listContainsObject(libraryName, findLibraryName)) &&
             (systemLibrary == false) ) { 

			logger.info("Querying list of " + type  + " from library [" + libraryIndex + "] " + librariesJson[libraryIndex].title + " [" + libraryId + "] - Page: " + page);

			authRequest.getJson('/wcmrest/query?type=' + type + '&pagesize=100&libraryid=' + libraryId + "&page=" + page)
			.then(function(result) {

				logger.debug("RESULT LIBRARY[" + libraryId + "]:\n" + result);
			
				return JSON.parse(result).feed.entry;
		
			})
			.then(function(dxListJson){

				if (dxListJson != undefined && dxListJson.length > 0) {
					//download all of the content and add their type references and image/file references to the todo list
					logger.info("PAGE SIZE [" + page + "]: " + dxListJson.length);

					if (type == typeContent) {
						initLibraryPath(connectionId, libraryId);
						dxListJson =  getContentByPage(dxListJson, connectionId, libraryId, dxListJson.length -1, todoList);

					} else if (type == typeContentTemplate) {
						// add all of the type ids in dxListJson to the todoList
						for (var index in dxListJson) {
							var typeId = dxUtils.cleanId(dxListJson[index].id); 

							// check the type id and add it to the list of types
							if (typeId != "") {
								logger.debug("Found type: " + typeId);

								var isFound = false;
								for (var c =0; c < todoList["types"].length; c++) {
									if (typeId == todoList["types"][c]) {
										isFound = true;
										logger.debug("already added: " + typeId);
									}
								}

								if (!isFound) {
									logger.info("Adding type to download list: " + typeId);
									todoList["types"].push(typeId);	
								}
							}
						}

					} else if (type == typeImage) {
						
						// add all of the resourceUri to the todoList["assets"]
						dxListJson =  getAssetJsonByPage(dxListJson, connectionId, libraryId, dxListJson.length -1, todoList);
						
					} else if (type == typeFile) {
						// add all of the resourceUri to the todoList["assets"]
						dxListJson =  getAssetJsonByPage(dxListJson, connectionId, libraryId, dxListJson.length -1, todoList);

					}

				} else {
					logger.info("No result of type " + type + " in page " + page);
				}

				return dxListJson;
			})
			.then(function(dxListJson) {

				if (dxListJson != undefined && dxListJson.length == 100)  {
					page++;
				} else if (type == typeContent) {
					// after all content have been downloaded, download all of the types in the library
					type = typeContentTemplate;
					page = 1;

				} else if (type == typeContentTemplate) {
					// after all types have been downloaded, download all of the images in the library
					type = typeImage;
					page = 1;
 
				} else if (type == typeImage) {
					// after all images have been downloaded, download all of the files in the library
					type = typeFile;
					page = 1;

				} else {
					// all pages have been downloaded so move on to the next library and start with content
					type = typeContent;
					libraryIndex = libraryIndex -1;
					page = 1;
				}
				
				deferred.resolve(getLibraryItems(librariesJson,  connectionId, findLibraryName, type, libraryIndex, page, todoList));
 
			})
			.fail(function(err) {
//				logger.error(err.message);
//				logger.error(err.stack);
				deferred.reject(err);
			});

		} else {
			
			logger.info("Skipping library " + librariesJson[libraryIndex].title + " [" + libraryId + "]");
			libraryIndex = libraryIndex -1;
			page = 1;
			deferred.resolve(getLibraryItems(librariesJson,  connectionId, findLibraryName, type, libraryIndex, page, todoList));
		}

	} else {
		deferred.resolve(todoList);
	}
	
	logger.debug("completed getLibraryItems " + currentLibraryIndex + ":" + currentPage + " - " + type);
	
	return deferred.promise;
}


function getContentTemplateList(connectionId, todoList, i) {
	 var deferred = Q.defer()
	
	if (i >= 0) {
		
		var id = todoList["types"][i];
		
		var path = genContentTemplatePath(connectionId, id);

		logger.debug("Processing type [" + i + "]: " + id); 
		
		getContentTemplateJson(id, path, i)
		.then(function(contentTemplateJson) {
			
			if (!fs.existsSync(path)) {
				fs.writeFileSync(path, JSON.stringify(contentTemplateJson, null, 4));
			}
			
			deferred.resolve(getContentTemplateList(connectionId, todoList, i -1));
			
		})
		.fail(function(err) {
			logger.info("ERROR: " + err);
			logger.info(err.stack);
			deferred.reject(err);
		});
		
	} else {
		deferred.resolve(todoList);
	}
	
	 
	 return deferred.promise;
}


function getAsset(connectionId, todoList, i) {
	 var deferred = Q.defer()
	
	if (i >= 0) {
		
		var asset = todoList["assets"][i];
		
		var filename = dxUtils.getAssetPath(asset, dir, connectionId);
		
		if (fs.existsSync(filename)) { 
			
			logger.info("Asset already downloaded [" + i + "]: " + filename);
			deferred.resolve(getAsset(connectionId, todoList, i-1));
			
		} else {
			authRequest.getFile(asset, filename)
			.then(function(data) {

				logger.info("Downloading asset [" + i + "]: " + filename);
				if (data.startsWith("FAILED")) {
					
				} 
			})
			.then(function() {
				deferred.resolve(getAsset(connectionId, todoList, i-1));
			})
			.fail(function(err) {
				logger.info("ERROR: " + err);
				logger.info(err.stack);
				deferred.reject(err);

			});
			
		}
		
		
	} else {
		deferred.resolve(todoList);
	}
	
	 
	 return deferred.promise;
}



function dxextract(args) {
	 var deferred = Q.defer();

	var settingsJSON = init(args);
	
	if (settingsJSON == undefined) {
		deferred.reject(new Error("Could not find definition for connectionId " + args['connectionId'] + " in " + args['settings']));
		return deferred.promise;
	}
	
	
	var connectionId = settingsJSON.connectionId
		, host = settingsJSON.host
		, port = settingsJSON.port
		, username = settingsJSON.username
		, password = settingsJSON.password
		, contentHandlerPath = settingsJSON.contentHandlerPath
		, secure = settingsJSON.secure
		, findLibraryName = settingsJSON.libraryName
		, lastModified = settingsJSON.lastModified
		;

	
	
	logger.info("Connection settings: " );
	logger.info("- connectionId: " +  connectionId);
	logger.info("- host: " +  host);
	logger.info("- port: " +  port);
	logger.info("- username: " +  username);
	logger.info("- password: " +  "**********");
	logger.info("- contentHandlerPath: " +  contentHandlerPath);
	logger.info("- secure: " +  secure);
	logger.info("- libraryName: " +  findLibraryName);
	

authRequest.init(host, port, username, password, contentHandlerPath, secure)
.then(function() {
	
  return authRequest.getJson(uriQueryLibraries);	
	
})
.then(function(result) {
	
	logger.debug("RESULT:\n" + result);
	
	var librariesJson = JSON.parse(result).feed.entry;
	
	logger.debug(librariesJson);
	
	if (undefined != librariesJson ) {
		logger.info("NUM LIBRARIES: " + librariesJson.length);
		
	} else {
		logger.error("NUM LIBRARIES: UNDEFINED!");
	}
    
	return librariesJson;
})
.then(function(librariesJson) {

	logger.info("DOWNLOADING CONTENT");

	return getLibraryItems(librariesJson, connectionId, findLibraryName, typeContent, librariesJson.length -1, 1, {types:[], assets:[], todos:{}});
		
})


.then(function(todoList) {

	dxUtils.saveJsonFile(todoList['libraries'], dir + "/" + connectionId + "/" + "libraryNames.json");
	
	return todoList;
})	
.then(function(todoList) {

	logger.info("CONTENT DOWNLOAD COMPLETED");
	
	logger.debug(typeof todoList["types"]);
	logger.debug("TypeList:" + todoList["types"]);
	logger.debug("TypeList length:" + todoList["types"].length);

	logger.info("DOWNLOADING TYPES");

	return getContentTemplateList(connectionId, todoList, todoList["types"].length - 1);
})
.then(function(todoList) {

	logger.info("TYPE DOWNLOAD COMPLETED");
	logger.info("DOWNLOADING ASSETS");
	
	return getAsset(connectionId, todoList, todoList['assets'].length - 1);
})

.then(function() {
	logger.info("ASSET DOWNLOAD COMPLETED");
})

.then(function() {

	var emptyFolders = dxUtils.findEmptyFolders(dir + "/" + connectionId + "/" + assetPath);

	if (emptyFolders.length > 0) {
		deferred.reject("The following assets failed to download: " + emptyFolders.toString());
		
	} else  {
			logger.info("No empty folders detected");
	}
})

.then(function() {
	deferred.resolve("Completed Successfully");
})
.fail(function(err) {
//    logger.error(err.message);
//    logger.error(err.stack);
    deferred.reject(err);
    
    
});


return deferred.promise;
}




var args = [];

var usage = "Usage: node dxextract.js -connectionId <connectionId> [-settingsFile <settingsFile> -password <password> -lastModified <lastModified> -dir <dir>";


try {
	args = dxUtils.processArgs(process.argv, 0,0, ["connectionId"],["settingsFile", "password", "lastModified", "dir"]);
} catch (err) {
	logger.error(err.message);
	logger.info(usage);
	process.exit(1);
}

try {

	dxextract(args)
	.then(function(message) {
		logger.info(message);
	})
	.fail(function(err) {
		if (err.message.includes("ECONNREFUSED")) {
			logger.error("Failed to connect to Portal Server.");
			logger.error("Verify connection info and that the Portal Server is running.");
			logger.debug(err.message);
			logger.debug(err.stack);
			
		} else {
			logger.error(err.message);
			logger.error(err.stack);
		}
		
		logger.transports.file.on('flush', function() {
			process.exit(-1);
		});
	});


} catch (err) {
	logger.error(err.message);
	logger.error(err.stack);
	logger.transports.file.on('flush', function() {
		process.exit(-1);
	});
}
