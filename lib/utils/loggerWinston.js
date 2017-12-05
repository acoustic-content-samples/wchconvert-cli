/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 */

var winston = require('winston'),
    CONSTANTS = require('./constants');

    
var moment = require('moment');  

winston.emitErrs = true;
winston.cli();

function consoleLogLevel() {
    switch (process.env.NODE_ENV) {
        case 'test':
        case 'development':
            return 'debug';
        case 'production':
            return 'info';
        default:
            return 'info';
    }
}

var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: consoleLogLevel(),
            filename: './wchconvert.log',
            handleExceptions: true,
            json: false,
            maxsize: 5*1024*1024, //5MB
            maxFiles: 5,
            tailable: true,
            colorize: false,
            formatter: formatterLog
        }),
        new winston.transports.Console({
            level: consoleLogLevel(),
            handleExceptions: true,
            json: false,
            colorize: true,
            formatter: formatterConsole
        })
    ],
    exitOnError: false
});  

logger.cli();

function formatTimeStamp() {
  var formattedTimeStamp = '';

  var now = moment();
  formattedTimeStamp = '[' + now.format('YYYY-MM-DD HH:mm:ss.SSS') + '] ' ;

  return formattedTimeStamp;

}

function formatterConsole(args) {
	return winston.config.colorize(args.level, formatTimeStamp() + '[' + args.level.toUpperCase() + '] wchconvert ' + CONSTANTS.VERSION + ' -') + args.message;
	
}

function formatterLog(args) {
	return formatTimeStamp() + '[' + args.level.toUpperCase() + '] wchconvert ' + CONSTANTS.VERSION + ' -' + args.message;
}


module.exports = logger;
module.exports.stream = {
    write: function(message){
        logger.info(message);
    }
};
