var mongodb = require('./db'),
	markdown = require('markdown').markdown;

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

// read article and  info 获取一个人的所有文章（传入参数 name）或获取所有人的文章（不传入参数）。
Post.getAll = function(name,callback) {
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
				// 解析 markdown 为 html
				docs.forEach(function (doc) {
					doc.post = markdown.toHTML(doc.post);
				});
				callback(null,docs); // success return result by array
			});
		});
	})	;
};

// 获取一篇文章
Post.getOne = function (name,day,title,callback) {
	// 打开数据库
	mongodb.open(function (err,db) {
		if (err) {
			return callback(err);
		}
	// 读取posts集合
	db.collection('posts',function (err,collection) {
		if (err) {
			mongodb.close();
			return callback(err);
		}
		// 根据用户名，发表日期及文章名查询
		collection.findOne({
			"name" : name,
			"time.day" :day,
			"title" : title
		},function (err,doc) {
			mongodb.close();
			if (err) {
				return callback(err);
			}
			// 解析markdown为html
			doc.post = markdown.toHTML(doc.post);
			callback(null,doc); // 返回查询的一篇文章
		});
	  }) ;
	});
};

// 返回原始发表的内容（markdown格式）
Post.edit = function (name,day,title,callback) {
	// 打开数据库
	mongodb.open(function (err,db) {
		if(err) {
			return callback(err);
		}
		// 读取posts集合
		db.collection('posts',function (err,collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			// 根据用户名、发表日期和文章名进行查询
			collection.findOne({
				"name" : name,
				"time.day" : day,
				"title" : title
			},function (err,doc) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
					callback(null,doc); // 返回码查询的一篇文章（markdown)格式
			});
		});
	});
};

// 更新一篇文章及其相关信息
Post.update = function (name,day,title,post,callback) {
	// 打开数据库
	mongodb.open(function (err,db) {
		if (err) {
			return callback(err);
		}
		// 读取posts集合
		db.collection('posts',function (err,collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// 更新文章内容
			collection.update({
				"name" :name,
				"time.day" :day,
				"title" : title
			},{
				$set :{post:post}
			},function (err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

//删除一篇文章
	Post.remove = function (name,day,title,callback) {
		// 打开数据库
		mongodb.open(function (err,db) {
			if (err) {
				return callback(err);
			}
			// 读取posts集合
			db.collection('posts',function (err,collection) {
				if (err) {
					mongodb.close();
					return callback(err);
				}
				// 根据用户名、日期和标题查找并删除一篇文章
				collection.remove({
					"name" :name,
					"time.day" :day,
					"title" : title
				},{
					w:1
				},function (err) {
					mongodb.close();
					if (err) {
						return callback(err);
					}
					callback(null);
				});
			});
		});
	};

/*return callback() // 返回，返回后执行回调函数*/