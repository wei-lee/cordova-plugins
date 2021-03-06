/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var exec = require('cordova/exec');
var argscheck = require('cordova/argscheck');
var DirectoryEntry = require('org.apache.cordova.file.DirectoryEntry');


// Open Discussion:
// * Should we have a purpose to expose the assets?
//   * Would it be any different from resolveLocalFileSystemURL('/')
// * Should we instead expose URLs instead of DirectoryEntry objects?
//   * e.g. On iOS, app-data://icloud=yes/, app-documents://icloud=no/, app-temp://, app-bundle://
//   * e.g. On Android, could use same schemes for 3.0+, or use content://cordova-app/app-data://... for 2.3
//   * This would mean APIs could be synchronous, and platform-specific locations can be kept on native side.
//   * This would allow things to be used as URLs for images.
//   * APIs (such as FileTransfer) work better with URLs (Paths are annoying, esp with Windows using \)
//   * Entry have a toURL() already. Without custom schemes, it won't work for Android resources & assets
// * Add support resolveLocalFileSystemURL()?


var fileextras = exports;

var Purpose = {
    'data': 0, // General application data (default)
    'documents': 1, // Files that are meaningful to other applciations (e.g. Office files)
    'cache': 2, // Temporary files that should survive app restarts
    'temp': 3, // Files that can should be deleted on app restarts
    'app-bundle': 4 // The application bundle (iOS only)
};

/**
 * Supplies a DirectoryEntry that matches the given constraints to the given callback.
 */
fileextras.getDirectoryForPurpose = function(purpose, options, successCallback, failureCallback) {
    argscheck.checkArgs('sOfF', 'fileextras.getDirectoryForPurpose', arguments);
    var augmentedSuccessCallback = successCallback && function(fullPath) {
        var lastSegment = fullPath.replace(/.*\//, '');
        // Note: the fileSystem property is null
        var directoryEntry = new DirectoryEntry(lastSegment, fullPath);
        successCallback(directoryEntry);
    };

    var purposeInt = Purpose[purpose];
    if (typeof purposeInt == 'undefined') {
        throw new Error('getDirectoryForPurpose: invalid purpose: ' + purpose);
    }
    options = options || {};

    var sandboxed = typeof options.sandboxed == 'undefined' ? true : !!options.sandboxed;
    var syncable = typeof options.syncable == 'undefined' ? true : !!options.syncable;

    var args = [purposeInt, sandboxed, syncable];
    exec(augmentedSuccessCallback, failureCallback, "FileExtras", "getDirectoryForPurpose", args);
};

fileextras.getDataDirectory = function(syncable, successCallback) {
    argscheck.checkArgs('*f', 'fileextras.getDataDirectory', arguments);
    fileextras.getDirectoryForPurpose('data', { syncable: syncable }, successCallback);
};

// On Android, this is the root of the SD card.
fileextras.getDocumentsDirectory = function(successCallback) {
    fileextras.getDirectoryForPurpose('documents', { syncable: true, sandboxed: false }, successCallback);
};

fileextras.getTempDirectory = function(successCallback) {
    fileextras.getDirectoryForPurpose('temp', null, successCallback);
};

fileextras.getCacheDirectory = function(successCallback) {
    fileextras.getDirectoryForPurpose('cache', null, successCallback);
};

