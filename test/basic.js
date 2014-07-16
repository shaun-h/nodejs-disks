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

});