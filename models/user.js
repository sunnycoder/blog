var mongodb = require('./db');

function User(user) {
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
};

module.exports = User;

//存储用户信息
User.prototype.save = function(callback) {
	// 要存入数据库的用户文档
	var user = {
		name: this.name,
		password: this.password,
		email:this.email
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

