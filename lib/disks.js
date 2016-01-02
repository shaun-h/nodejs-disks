var exec = require('child_process').exec,
    path = require('path'),
    os = require('os');

var async = require('async'),
    numeral = require('numeral');

/**
 * Retrieve disks list.
 *
 * @param callback
 */
exports.drives = function (callback) {
    switch (os.platform().toLowerCase()) {
        case'darwin':
            getDrives('df -kl | awk \'{print $1}\'', callback);
            break;
        case'win32':
            getDrives('wmic logicaldisk get caption', function(e, d) {
              if(d) {
                for(var i=0; d.length > i; i++) {
                  d[i] = d[i].trim();
                }
                d.pop();
              }
              callback(e, d);
            });
            break;
        case'linux':
        default:
            getDrives('df -P | awk \'{print $1}\'', callback);
    }
};

/**
 * Execute a command to retrieve disks list.
 *
 * @param command
 * @param callback
 */
function getDrives(command, callback) {
    var child = exec(
        command,
        function (err, stdout, stderr) {
            if (err) return callback(err);
            var drives = stdout.split('\n');

            drives.splice(0, 1);
            drives.splice(-1, 1);

            // Removes ram drives
            drives = drives.filter(function(item){ return item != "none"});
            callback(null, drives);
        }
    );
}

/**
 * Retrieve space information about one drive.
 *
 * @param drive
 * @param callback
 */
exports.driveDetail = function (drive, callback) {
    detail(drive, callback);
};

/**
 * Retrieve space information about each drives.
 *
 * @param drives
 * @param callback
 */
exports.drivesDetail = function (drives, callback) {
    var drivesDetail = [];

    async.eachSeries(
        drives,
        function (drive, cb) {
            detail(
                drive,
                function (err, detail) {
                    if (err) return cb(err);
                    drivesDetail.push(detail);
                    cb();
                }
            );
        },
        function (err) {
            if (err) return callback(err);
            callback(null, drivesDetail);
        }
    );
};

/**
 * Retrieve space information about one drive.
 *
 * @param drive
 * @param callback
 */
function detail(drive, callback) {
    async.series(
        {
            used: function (callback) {
                switch (os.platform().toLowerCase()) {
                    case'darwin':
                        getDetail('df -kl | grep ' + drive + ' | awk \'{print $3}\'', callback);
                        break;
                    case'win32':
                          getDetailNaN('wmic logicaldisk get caption,freespace,size | FindStr "' + drive + '"', function(e, d) {

                          if(d) {
                            d = d.substr(2);
                            d = d.trim();
                            d = d.split(" ");
                            d = (parseInt(d[d.length-1]) - parseInt(d[0]));
                          }

                          callback(e, d);
                        });
                        break;
                    case'linux':
                    default:
                        getDetail('df -P | grep ' + drive + ' | awk \'{print $3}\'', callback);
                }
            },
            available: function (callback) {
                switch (os.platform().toLowerCase()) {
                    case'darwin':
                        getDetail('df -kl | grep ' + drive + ' | awk \'{print $4}\'', callback);
                        break;
                    case'win32':
                      getDetailNaN('wmic logicaldisk get caption,freespace | FindStr "' + drive + '"', function(e, d) {
                        if(d) {
                          d = d.substr(2);
                          d = parseInt (d.trim(), 10);
                        }
                        callback(e, d);
                      });
                      break;
                    case'linux':
                    default:
                        getDetail('df -P | grep ' + drive + ' | awk \'{print $4}\'', callback);
                }
            },
            mountpoint: function (callback) {
                switch (os.platform().toLowerCase()) {
                    case'darwin':
                        getDetailNaN('df -kl | grep ' + drive + ' | awk \'{print $9}\'', function(e, d){
                            if (d) d = d.trim();
                            callback(e, d);
                        });
                        break;
                    case'win32':
                      callback(null, drive);
                      break;
                    case'linux':
                    default:
                        getDetailNaN('df -P | grep ' + drive + ' | awk \'{print $6}\'', function(e, d){
                            if (d) d = d.trim();
                            callback(e, d);
                        });
                }
            },
            volumename: function(callback) {
                switch (os.platform().toLowerCase()) {
                    case'darwin':
                        getDetailNaN('df -kl | grep ' + drive + ' | awk \'{print $9}\'', function(e, d){
                            if (d) {
                              d = path.basename(d.trim());
                            }
                            callback(e, d);
                        });
                        break;
                    case'win32':
                      getDetailNaN('wmic logicaldisk get caption,volumename | FindStr "' + drive + '"', function(e, d) {
                        if(d) {
                          d = d.substr(2);
                          d = d.trim();
                        }
                        callback(e, d);
                      });
                      break;
                    case'linux':
                    default:
                        getDetailNaN('df -P | grep ' + drive + ' | awk \'{print $6}\'', function(e, d){
                            if (d) {
                              d = path.basename(d.trim());
                            }
                            callback(e, d);
                        });
                }
            }
        },
        function (err, results) {
            if (err) return callback(err);
            results.freePer = Number(results.available / (results.used + results.available) * 100);
            results.usedPer = Number(results.used / (results.used + results.available) * 100);
            results.total = numeral(results.used + results.available).format('0.00 b');
            results.used = numeral(results.used).format('0.00 b');
            results.available = numeral(results.available).format('0.00 b');
            results.drive = drive;

            callback(null, results);
        }
    );
}

/**
 * Execute a command.
 *
 * @param command
 * @param callback
 */
function getDetail(command, callback) {
    var child = exec(
        command,
        function (err, stdout, stderr) {
            if (err) return callback(err);
            callback(null, parseInt(stdout) * 1024);
        }
    );
}

/**
 * Execute a command.
 *
 * @param command
 * @param callback
 */
function getDetailNaN(command, callback) {
    var child = exec(
        command,
        function (err, stdout, stderr) {
            if (err) return callback(err);
            callback(null, stdout);
        }
    );
}
