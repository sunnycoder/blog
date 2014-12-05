var mongodb = require('./db');

function Post(name,title,post) {
	this.name = name;
	this.title = title;
	this.post = post;
}

module.exports = Post;

//save a article 
Post.prototype.save = function (callback) {
	var date = new Date();
	// save time in different format for extend
	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + "-" + (date.getMonth() + 1),
		day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
		minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
      	date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	}
	// post entity
	var post = {
		name: this.name,
		time: time,
		title: this.title,
		post: this.post
	};
	// open db
	mongodb.open(function (err,db) {
		if (err) {
			return callback(err);
		}
		// read posts collection

		db.collection('posts',function (err,collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			// insert post into posts collections
			collection.insert(post,{
				safe:true
			},function(err) {
				mongodb.close();
				if(err) {
					return callback(err); // fail
				}
				callback(null); // err==null
			});
		});
	});
};

// read article and  info
Post.get = function(name,callback) {
	// open db
	mongodb.open(function(err,db) {
		if (err) {
			// console.log("1");
			return callback(err);
		}
		// read posts collections
		db.collection('posts',function (err,collection) {
			if (err) {
				console.log("2");
				mongodb.close();
				return callback(err);
			}
			var query = {};
			if (name) {
				query.name = name;
			}
			//search articl by query object
			collection.find(query).sort({
				time: -1
			}).toArray(function (err,docs) {
				mongodb.close();
				if(err) {
					return callback(err); // fail
				}
				callback(null,docs); // success return result by array
			});
		});
	})	;
};