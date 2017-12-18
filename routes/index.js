var express = require('express');
var router = express.Router();
var mongoose = require ('mongoose');
var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost:27017/RMSdb');
var autoIncrement = require ('mongoose-auto-increment');
autoIncrement.initialize(mongoose.connection);
var twilio = require('twilio');
require('dotenv').config();
const client = twilio(process.env.accountSid,process.env.authToken);
// saving images with GridFS
//var Grid = require('gridfs-stream');
var fs = require('fs');
//connect GridFS to Mongo
//Grid.mongo = mongoose.mongo;
//var gfs = Grid(mongoose.connection.db);

var userDataSchema = new Schema({
	lat:Number,
	lng:Number,
	simNu:{
        type: String,
        validate: {
          validator: function(v) {
            return /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/.test(v);
          },
          message: '{VALUE} is not a valid phone number!'
        },
        required: [true, 'User phone number required']
      },
	loc:String
},{Collection:'sensordb',timestamps: true});
userDataSchema.plugin(autoIncrement.plugin,{model:'sensordb', startAt:1});
var sensordb = mongoose.model('sensordb',userDataSchema,'sensordb');

var CommErrSchema = new Schema({
	simNu:{
        type: String,
        validate: {
          validator: function(v) {
            return /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/.test(v);
          },
          message: '{VALUE} is not a valid phone number!'
        },
        required: [true, 'User phone number required']
      },
	msgbody:String  
},{collection:'CommErrdb',timestamps: true});
CommErrSchema.plugin(autoIncrement.plugin,{model:'CommErr', startAt:1})
var CommErr = mongoose.model('CommErr',CommErrSchema);

var TwilioDataSchema = new Schema({
	charge:Number
},{timestamps: true});
TwilioDataSchema.plugin(autoIncrement.plugin,{model:'TwilioData', startAt:1})
var TwilioData = mongoose.model('TwilioData',TwilioDataSchema,'TwilioData');

var NoteContsSchema = new Schema({
	fname:String,
	lname:String,
	simNu:{
        type: String,
        validate: {
          validator: function(v) {
            return /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/.test(v);
          },
          message: '{VALUE} is not a valid phone number!'
        },
        required: [true, 'User phone number required']
      }, 
	note:String  
},{collection:'noteconts',timestamps: true});
NoteContsSchema.plugin(autoIncrement.plugin,{model:'noteconts', startAt:1});
var noteconts = mongoose.model('noteconts',NoteContsSchema,'noteconts');

var WarningDataSchema = new Schema({
	snr_id:Number,
	simNu:Number,
	snr_loc:String,
	msg:String,
	action:String
},{timestamps: true});
WarningDataSchema.plugin(autoIncrement.plugin,{model:'warningsdata', startAt:1});
var warningsdata = mongoose.model('warningsdata',WarningDataSchema,'warningsdata');

var camsSchema = new Schema({
	Snrid:Number,
	loc:String,
	campos:String,
	simNu:{
        type: String,
        validate: {
          validator: function(v) {
            return /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/.test(v);
          },
          message: '{VALUE} is not a valid phone number!'
        },
        required: [true, 'User phone number required']
      }  
},{collection:'camsdb',timestamps: true});
camsSchema.plugin(autoIncrement.plugin,{model:'camsdb', startAt:1});
var camsdb = mongoose.model('camsdb',camsSchema,'camsdb');

var photosSchema = new Schema({
	img:
	{ data: Buffer,
	contentType: String
	},
	simNu:{
        type: String,
        validate: {
          validator: function(v) {
            return /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/.test(v);
          },
          message: '{VALUE} is not a valid phone number!'
        },
        required: [true, 'User phone number required']
      }  
},{collection:'photosdb',timestamps: true});
camsSchema.plugin(autoIncrement.plugin,{model:'photosdb', startAt:1});
var photosdb = mongoose.model('photosdb',photosSchema,'photosdb');

//Cameras database/ request,save,and load mms
router.post('/mmsmsg', function(req, res, next) {	
//add camera
if(req.body.camadd == 'Add'){
	req.check('Snrid', 'Sensor ID is required').notEmpty();
	req.check('loc', 'Location is required').notEmpty();
	req.check('campos', 'Camera position is required').notEmpty();
	req.check('camsimNu', 'UK contact number, should start with +44').isMobilePhone("en-GB");
	var errors = req.validationErrors();
	camsdb.findOne({'simNu': req.body.camsimNu},function(err,doc){
if (doc){
req.session.st = 'Camera sim number is already in the list, please use a diffrent number';
req.session.err =true;
res.redirect('/warnings');
	return
}
	});
if (errors){
req.session.err =errors;
res.redirect('/warnings');
}else{
	var item ={
	Snrid: req.body.Snrid,
	loc: req.body.loc,
	campos: req.body.campos,
	simNu: req.body.camsimNu
	};
	var data= new camsdb(item);
	data.save(function (err){
if(err){
req.session.err =err;	
res.redirect('/warnings');
return
}
	});
req.session.suc =true;
req.session.stat = 'Camera is added to the database';
	// send sms to request initial MMS
	client.messages.create({
		to: req.body.camsimNu,
		from: process.env.Twilio_no,
		body: '111'
		}, function(err, message) {
		if (err){
		console.log(err);
		}else{
		console.log(message.sid)
		}
		});
res.redirect('/warnings');
}
}//end of if add

//find
if(req.body.camfind == 'Find by ID'){
	camsdb.findById(req.body.id,function(err,doc){
if(err){
req.session.err =err;	
res.redirect('/warnings');
}else{
	sensordb.find()
	.then(function(obj1){
	warningsdata.find()
	.then(function(obj2){
res.render('warnings',{layout: 'rmsMonitorLayout.hbs', success:req.session.suc, errors:req.session.err, items:obj1, objs:obj2, _id:doc._id, Snrid:doc.Snrid, loc:doc.loc, campos:doc.campos, simNu:doc.simNu});
req.session.err = null;
req.session.suc = null;	
	});
	});	
}
	});
}//end of find

//Update
if(req.body.camupdate == 'Update'){
	camsdb.findById(req.body.id, function(err, doc){
if(err || doc.length == 0){
req.session.err = err;
req.session.stat = 'error, no entry found';
res.redirect('/warnings');
}else{
	doc.Snrid= req.body.Snrid;
	doc.loc= req.body.loc;
	doc.campos= req.body.campos;
	doc.simNu= req.body.camsimNu;
	doc.save(function (err){
if(err) console.log(err);
	return
	});
req.session.suc = true;
req.session.stat = 'Camera info. is updated';
res.redirect('/warnings');	
}
	});
}

//Delete
if(req.body.camtdele == 'Delete'){
	camsdb.findByIdAndRemove(req.body.id).exec();
req.session.suc = true;
req.session.stat = 'Camera info. is deleted';
res.redirect('/warnings');
	}

//load cameras data
if(req.body.lddata == 'Load cameras list'){
	camsdb.find()
	.then(function(obj2){
req.session.suc = true;
req.session.stat = 'The list of cameras is loaded';
req.session.lst = obj2;	
res.redirect('/warnings');
	});// close of cams data
}

//request mms photo from a certian camera
if(req.body.reqmms == 'Request MMS'){
var simNu= req.body.camsimNu;
if (!simNu){
req.session.err = true;
req.session.stat = 'Please "Find by ID" the required camera first!';
res.redirect('/warnings');
	return
}	
	
//this is temp to save qts log into photosdb
console.log('Inside request MMS');
//var imgPath = './qts_logo.png';
var imgPath = './cam_2/12.png';
var newitem = new photosdb();
newitem.img.data = fs.readFileSync(imgPath);
newitem.img.contentType = 'image/png';
newitem.simNu = req.body.camsimNu;
newitem.save(function (err){
if(err){
req.session.err = err;
req.session.stat = 'Photo not saved';
}else{
req.session.suc = true;
req.session.stat = 'Photo is saved';
console.log('Photo saved');
}
});
res.redirect('/warnings');


/*
	//send sms to the selected camera
	client.messages.create({
		to: simNu,
		from: process.env.Twilio_no,
		body:	'111'
		}, function(err, message) {
		if (err){
		console.log(err);
		}else{
		console.log(message.sid)
		}
		});
req.session.success =true;
req.session.stat = 'Photo is requested from the selected camera, please "load photos" to check if the photo is received';
res.redirect('/warnings');
*/
}

//load MMS pictures
if(req.body.loadmms == 'Load photos'){
var simNu= req.body.camsimNu;
if (!simNu){
req.session.err = true;
req.session.stat = 'Please "Find by ID" the required camera first!';
res.redirect('/warnings');
	return
}	
photosdb.find({'simNu':simNu}, function(err, docs){
	if(err){
	console.error('error, no entry found');
res.redirect('/warnings');
	}else{
	var photos = [];
		docs.forEach(function(u){
		var item = {
			img:u.img.data.toString('base64'),
			date:u.createdAt.toString().slice(0,15)
			};
		photos.push(item);
		});	
req.session.photo = photos;
req.session.success =true;
req.session.stat = 'Photos are loaded to the webpage';
res.redirect('/warnings');
	}
	});
	}
});

//route to /warnings
router.get('/warnings', function(req, res, next) {
	//console.log(req.session.photo);
	sensordb.find()
	.then(function(doc){
	warningsdata.find()
	.then(function(obj){
res.render('warnings',{title:'Warnings', layout:'rmsMonitorLayout.hbs', success:req.session.suc, errors:req.session.err, stus:req.session.stat, lst:req.session.lst, photos:req.session.photo , items:doc, objs:obj});
req.session.err = null;
req.session.suc = null;
req.session.lst = null;
req.session.stat = null;
req.session.photo = null;
	});
	});
});

//Twillio income msg
router.post('/message', function(req, res, next) {
	var msgFrom = req.body.From;
	var msgBody = req.body.Body;
	console.log(msgFrom);
	console.log(msgBody);
	var tst = msgBody.indexOf('Alarm');
	//check if the message from the registered contacts
	noteconts.findOne({'simNu': msgFrom},function(err,doc){
	if(doc){
	if (msgBody === 'RMS out'){
	noteconts.findByIdAndRemove(doc._id).exec();
	res.send(`
	<Response>
	<Message>
	Hi ${doc.fname} ${doc.lname}, your contact number has been removed from RMS list.
	</Message>
	</Response>
	`);
	}else{
	var item ={
	simNu: msgFrom, 
	msgbody: msgBody};
	var data= new CommErr(item);
	data.save();
	res.send(`
	<Response>
	<Message>
	Hi ${doc.fname} ${doc.lname}. To opt out, please text 'RMS out'.
	</Message>
	</Response>
	`);
	}
	}
	});
	// check if the message from RMS sensor
	sensordb.findOne({'simNu': msgFrom},function(err,doc){
	//if the number not in the list then log the details into Communication Error Collection
	if(err||doc == null){
	console.log('Strange number');
	var item ={
	simNu: msgFrom, 
	msgbody: msgBody};
	var data= new CommErr(item);
	data.save();
		return
	}
	else if (tst !== -1){
// record the message into warningsdata
	console.log('Warning message');
	var item1 ={
	snr_id:doc._id,
	simNu:msgFrom,
	snr_loc:doc.loc,
	msg:msgBody,
	action:'Recorded'	
	}
	var data1= new warningsdata(item1);
	data1.save(function (err){
			if(err) console.log(err);
			});
// Send sms to all registered contacts
    noteconts.find( function(err, docs) {
        if (err || docs.length == 0) console.log(err);
        else{
        docs.forEach(function(contact) {
        client.messages.create({
		to: contact.simNu,
		from: process.env.Twilio_no,
		body: 'Hi '.concat(contact.fname)+'\xa0'.concat(contact.lname)+' This is a warning message from sensor'.concat(doc._id)+'For more details visit http://b23fa1f4.ngrok.io/warnings'
		}, function(err, message) {
		if (err){
		console.log(err);
		}else{
		console.log(message.sid)
		}
		});
		});
		}
	});
	
	}else{ //health check info
	console.log('Health check message');	
	var sim = msgFrom.slice(8);
	var filename = 'S'.concat(sim);
	console.log(filename);
	var TwilioData = mongoose.model(filename,TwilioDataSchema,filename);
	var item2 ={
	charge: 100
	};
	var data2 = new TwilioData(item2);
	data2.save(function (err){
			if(err) console.log(err);
			});
	}
	});
	//check if the message from MMS cameras
	camsdb.findOne({'simNu': msgFrom},function(err,doc){
		
		
	});
	
	
	
});

/* GET home page. */
router.get('/', function(req, res, next) {
res.render('index', {title:'Rockfall Monitoring System'});
});

//route to /rmsoverview
router.get('/rmsoverview', function(req, res, next) {
	sensordb.find()
	.then(function(doc){
	res.render('rmsoverview',{layout:'rmsMonitorLayout.hbs', items:doc});
	});
});

//route to add CMS sensors
router.post('/add', function(req, res, next) {
	req.check('lat', 'Invalid UK latitude coordinate').matches(/^([5][0-9])|^([5][0-9])\.[0-9]{1,4}$/);
	req.check('lng', 'Invalid UK longitude coordinate').matches(/^-[1-8]\.?\d{0,4}?$|^[0-2]\.?\d{0,4}?$/);
	req.check('simNu', 'Invalid UK contact number, should start with +44').matches(/^\+[4][4][7]\d{9}$/);
	var errors = req.validationErrors();
	if (errors){
	req.session.errors = errors;
res.redirect('/editlist');
	}
	else
	{
//check if the sim number already in the sensordb
	sensordb.findOne({'simNu':req.body.simNu},function(err,doc){
	if (doc){
	req.session.errors = true;
	req.session.stat = 'Sim number is already used in sensor ID:'.concat(doc._id);
res.redirect('/editlist');
	return
	}
	else{
	var item ={
	lat: req.body.lat,
	lng: req.body.lng,
	simNu: req.body.simNu,
	loc: req.body.loc
	};
	var data= new sensordb(item);
	data.save(function (err){
	if(err)req.session.errors = err;
	else{
	//create a sensor database and add initial chrage data
	var sim = req.body.simNu.slice(8);
	var filename = 'S'.concat(sim);
	var TwilioData = mongoose.model(filename,TwilioDataSchema,filename);
	var item2 ={
	charge: 100
	};
	var data2 = new TwilioData(item2);
	data2.save(function (err){
	if(err)req.session.errors = err;
	});
	req.session.success =true;
	console.log('Data saved to sensordb');
	req.session.stat ='Sensor info is saved and a new data file is created';
	}
res.redirect('/editlist');
});//end of saving data to sensordb
	}
	});//end of check sim number function
	}
});
	
//route to edit sensors list: find modify and delete /findcmsdata
router.post('/editcms', function(req, res, next){
	//find
	if(req.body.find == 'Find by ID'){	
	sensordb.findById(req.body.editid,function(err,doc){
	if(err){
		req.session.errors =err;
		res.redirect('/editlist');
	}
	else if(doc == null){
		req.session.errors=true;
		req.session.stat = 'ID is not found, please use a vaild ID';		
		res.redirect('/editlist');
	}
	else{
		console.log(doc.loc);
	sensordb.find()
	.then(function(obj){
res.render('editlist',{title:'Edit sensor list', layout:'rmsMonitorLayout.hbs', items:obj, editid:doc._id, editlat:doc.lat, editlng:doc.lng, editsimNu:doc.simNu, editloc:doc.loc});
	});
	}
	});
	}
	//Update
	if(req.body.update == 'Update'){
	sensordb.findById(req.body.editid, function(err, doc){
	if(err){
	req.session.errors =err;	
res.redirect('/editlist');
	}else{
	if(doc.simNu !== req.body.editsimNu){
	var	old_name='S'.concat(doc.simNu.slice(8));
	var	new_name='S'.concat(req.body.editsimNu.slice(8));
	var db = mongoose.connection.db;
	db.collection(old_name).rename(new_name, function(err,collection){
	if (err){
	req.session.errors =err;	
res.redirect('/editlist');
	}
	});
	}
	doc.lat= req.body.editlat;
	doc.lng= req.body.editlng;
	doc.simNu= req.body.editsimNu;
	doc.loc= req.body.editloc;
	doc.save(function (err){
	if(err){
	req.session.errors =err;	
res.redirect('/editlist');	
	}
	});
req.session.success =true;
req.session.stat = 'Sensor data is updated';
res.redirect('/editlist');	
	}
	});
	}
	//delete
	if(req.body.dele == 'Delete'){
	//change the name of associated collection to S_simNu_deleted
	sensordb.findById(req.body.editid,function(err,doc){
	if(err){
	req.session.errors =err;	
res.redirect('/editlist');	
	}
	var d = new Date().toISOString().replace(/T.+/,'');
	var divide = d.split('-');
    var date = divide[0]+divide[1]+divide[2];
	var	old_name='S'.concat(doc.simNu.slice(8));
	var	new_name='S'.concat(doc.simNu.slice(8)).concat('D').concat(date);
	var db = mongoose.connection.db;
	db.collection(old_name).rename(new_name, function(err,collection){
	if (err){
	req.session.errors =err;	
res.redirect('/editlist');	
	}
	});
	});
	sensordb.findByIdAndRemove(req.body.editid).exec()
	req.session.success =true;
req.session.stat = 'Sensor data is deleted';
	res.redirect('/editlist');
	}
});

//route to add notification contacts' details
router.post('/noteconts', function(req, res, next) {		
//add contact
if(req.body.contadd == 'Add'){
	req.check('fname', 'First name required').notEmpty();
	req.check('lname', 'Last name required').notEmpty();
	req.check('contsimNu', 'UK contact number, should start with +44').isMobilePhone("en-GB");
	req.check('fname', 'First name required').notEmpty();
	var errors = req.validationErrors();
	noteconts.findOne({'simNu': req.body.contsimNu},function(err,doc){
	if (doc){
	req.session.stat = 'Contact number already in the list, please use a diffrent number';
	req.session.errors =true;
	res.redirect('/editlist');	
	}
	});
	if (errors){
	req.session.errors =errors;
	res.redirect('/editlist');
	}else{
	var date = new Date().toISOString().replace(/T.+/,'');
	var item ={
	fname: req.body.fname,
	lname: req.body.lname,
	simNu: req.body.contsimNu,
	date: date,
	note: req.body.note  
	};
	var data= new noteconts(item);
	data.save(function (err){
	if(err){
	req.session.errors =err;	
res.redirect('/editlist');
	}
	});
	req.session.success =true;
	req.session.stat = 'Contact is added';
	// send sms to confirm of adding the number
	client.messages.create({
		to: req.body.contsimNu,
		from: process.env.Twilio_no,
		body: 'Hi '.concat(req.body.fname)+'\xa0'.concat(req.body.lname)+', your contact number is added to RMS contact list, to opt out please text "RMS out" to '.concat(process.env.Twilio_no)
		}, function(err, message) {
		if (err){
		console.log(err);
		}else{
		console.log(message.sid)
		}
		});
		
res.redirect('/editlist');
}
}//end of if add

//find
if(req.body.contfind == 'Find by ID'){
noteconts.findById(req.body.id,function(err,doc){
	if(err){
	req.session.errors =err;	
res.redirect('/editlist');
	}else{
sensordb.find()
	.then(function(obj){	
res.render('editlist',{title:'Edit contact list',layout:'rmsMonitorLayout.hbs',items:obj,id:doc._id,fname:doc.fname,lname:doc.lname,simNu:doc.simNu,note:doc.note});
	});
	}
});
}//end of find

//Update
if(req.body.contupdate == 'Update'){
	var date = new Date().toISOString().replace(/T.+/,'');
	noteconts.findById(req.body.id, function(err, doc){
	if(err)	console.error('error, no entry found');
	else {
	doc.fname= req.body.fname;
	doc.lname= req.body.lname;
	doc.simNu= req.body.contsimNu;
	doc.date= date;
	doc.note= req.body.note;
	doc.save(function (err){
	if(err) console.log(err);
	});
	}
	});
	req.session.success =true;
	req.session.stat = 'Contact is updated';
res.redirect('/editlist');
}

//Delete
if(req.body.contdele == 'Delete'){
	noteconts.findByIdAndRemove(req.body.id).exec();
	req.session.success =true;
	req.session.stat = 'Contact is deleted';
res.redirect('/editlist');
	}

//load data
if(req.body.loaddata == 'Load'){
noteconts.find()
	.then(function(obj2){
	req.session.lst = obj2;	
res.redirect('/editlist');
	});// close of contacts data
}

});

//route to /editlist
router.get('/editlist', function(req, res, next) {
	sensordb.find()
	.then(function(doc){
res.render('editlist',{title:'Edit sensor list',layout: 'rmsMonitorLayout.hbs', success:req.session.success, errors:req.session.errors,input_status:req.session.stat, items:doc, lst:req.session.lst});
	req.session.errors = null;
	req.session.success = null;
	req.session.stat = null;
	req.session.lst = null;
	});
});

//route to /monitor individual sensors
router.get('/monitorsensors', function(req, res, next) {
	if(req.query.S){
	sensordb.findById(req.query.S,function(err,obj1){
	if(err)req.session.errors =err;
	var filename = 'S'.concat(obj1.simNu.slice(8));
	var SensorData = mongoose.model(filename,TwilioDataSchema,filename);
	SensorData.find()
	.then (function(obj2){
	sensordb.find()
	.then(function(doc){
res.render('monitorsensors',{title:'Monitor individual sensor',layout: 'rmsMonitorLayout.hbs',success:req.session.success, errors:req.session.errors, items:doc, obj:obj2});
	req.session.errors = null;
	req.session.success = null;
	});//close of sensordb
	});//close of SensorData
	});
	}
	else{
	sensordb.find()
	.then(function(doc){
res.render('monitorsensors',{title:'Monitor individual sensor',layout: 'rmsMonitorLayout.hbs',success:req.session.success, errors:req.session.errors, items:doc});
	req.session.errors = null;
	req.session.success = null;
	});
	}
});

//route to /about
router.get('/about', function(req, res, next) {
	res.render('about');
});

//route to /contact
router.get('/contact', function(req, res, next) {
	res.render('contact');
});

module.exports = router;