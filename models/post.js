var mongodb = require('./db'),
	markdown = require('markdown').markdown;

function Post(name,head,title,tags,post) {
	this.name = name;
	this.head = head;
	this.title = title;
	this.tags = tags;
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
		head : this.head,
		time: time,
		title: this.title,
		tags : this.tags,
		post: this.post,
		comments : [],
		pv : 0
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
// 增加分页效果，一次获取十篇
Post.getTen = function(name,page,callback) {
	// open db 打开数据库
	mongodb.open(function(err,db) {
		if (err) {
			// console.log("1");
			return callback(err);
		}
		// read posts collections  读取posts集合
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
			// 使用count返回特定查询的文档书total
			collection.count(query,function (err,total) {
				// 根据query对象查询，并跳过前（page-1）*10个结果，并返回之后的10个结果
			collection.find(query,{
				skip : (page - 1)*10,
				limit : 10
			}).sort({
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
				callback(null,docs,total); // success return result by array
			})
	
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
			
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// pv
			if (doc) {
				// 每访问一次，pv+1
				collection.update({
					"name" :name,
					"time.day" :day,
					"title" : title
				},{
					$inc : {"pv":1}
				},function (err) {
					mongodb.close();
					if (err) {
						return callback(err);
					}
				});
							// 解析markdown为html
			if (doc) {
				doc.post = markdown.toHTML(doc.post);
				doc.comments.forEach(function (comment) {
					comment.content = markdown.toHTML(comment.content);
				});
			  }
			callback(null,doc); // 返回查询的一篇文章
			}	
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

// 返回所有文章的存档信息
Post.getArchive = function (callback) {
	// 打开数据库
	mongodb.open(function (err,db) {
		if (err) {
			return callback(err);
		}
		// 读取posts集合
		db.collection('posts',function (err,collection) {
			if (err)  {
				mongodb.close();
				return callback(err);
			}
			// 返回包含name,time,title属性的文档组成的存档数组
			collection.find({},{
				"name" : 1,
				"time" : 1,
				"title" :1

			}).sort({
				time : -1
			}).toArray(function (err,docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};

// 返回所有标签
Post.getTags = function (callback) {
	// open db
	mongodb.open(function (err,db) {
		if (err) {
			return callback(err);
		}
		// read posts collection
		db.collection('posts',function (err,collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// distinct 用来找出给定规律的所有不同值
			collection.distinct("tags",function (err,docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};

// 返回含有特定标签的所有文章
Post.getTag = function (tag,callback) {
	// open db
	mongodb.open(function (err,db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts',function (err,collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
		
		// 查询所有tags数组内包含的tag的文档
		// 并返回只含有name,time,title组成的数组
		collection.find({
			"tags" : tag
		},{
			"name" : 1,
			"time" : 1,
			"title" : 1
		}).sort({
			time : -1
		}).toArray(function (err,docs) {
			mongodb.close();
			if (err) {
				return callback(err);
			}
			callback(null,docs);
		});
		});
	});
};

// 返回通过标题关键字查询的所有文章信息
Post.search = function (keyword,callback) {
	// open database
	mongodb.open(function (err,db) {
		if (err) {
			return callback(err);
		}
		// read posts collection
		db.collection('posts',function (err,collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// 正则表达式语法：
			var pattern = new RegExp(keyword,"i");	// i:执行对大小写不敏感的匹配
			collection.find({
				"title" :pattern
			},{
				"name" :1,
				"time" :1,
				"title" :1
			}).sort({
				time:-1
			}).toArray(function (err,docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};
/*return callback() // 返回，返回后执行回调函数*/