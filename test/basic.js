var mocha = require("mocha");
var should  = require("should");

var disk = require("../");


describe('Basic Interface', function(){

	it("should have a few functions", function(done){
		disk.drives.should.be.Function
		disk.driveDetail.should.be.Function
		disk.drivesDetail.should.be.Function
		done();
	});

	it("mount should not be empty", function(done){
		disk.drives(function (err, drives) {
			should.not.exist(err);
			disk.drivesDetail(drives, function (err, diskResults) {
				should.not.exist(err);
				diskResults.should.be.Array;
				diskResults[0].mountpoint.should.not.containEql("\n");
				done();
			});
		});
	});

});