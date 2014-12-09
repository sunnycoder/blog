var mongodb = require('./db');

var crypto = require('crypto');

function User(user) {
	this.name = user.name;
	this.head = user.head;
	this.password = user.password;
	this.email = user.email;
};

module.exports = User;

//存储用户信息
User.prototype.save = function(callback) {
	// md5加密
	var md5 = crypto.createHash('md5'),
		email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
		head = "http://en.gravatar.com/avatar/" +email_MD5 + "?s=48";
	// 要存入数据库的用户文档,包含头像信息等	
	var user = {
		name: this.name,
		password: this.password,
		email:this.email,
		head : head
	};
	//open db
	mongodb.open(function (err,db) {
	if(err) {
		return callback(err); // error  return err message
	}
	//读取user集合
	db.collection('user',function (err,collection) {
		if(err) {
			mongodb.close();
			return callback(err);
		}
	//将用户数据插入user集合
	collection.insert(user, {
		safe:true
	},function (err,user) {
		mongodb.close();
		if(err) {
			return callback(err);	// 
		}
		callback(null,user[0]);		// 
	 });
	});
  });
};

//读取用户信息
User.get = function(name,callback) {
	//open db
	mongodb.open(function(err,db) {
		if(err) {
			return callback(err);
		}
		// read user collection
		db.collection('user',function(err,collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			// search a doucment where username as name
			collection.findOne({
				name:name
			},function(err,user) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null,user); //
			});
		});
	});
};

