/**
*路由器用于捕获各种请求
*/

// var express = require('express');
// var router = express.Router();

// /* GET home page. */
// router.get('/', function(req, res) {
//   res.render('index', { title: 'Express' });
// });

// module.exports = router;

var crypto =require('crypto'),  // 用它生成散列值来加密密码。
    User = require('../models/user.js'),
    Post = require('../models/post.js');


module.exports = function (app) {
	app.get('/',function (req,res) {
		Post.get(null,function (err,posts) {
			if(err) {
				console.log("message");
				posts = [];
			}
			res.render('index',{
			title:'Home',
			user:req.session.user,
			posts:posts,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		  });
		});
	});
	// app.post('/',function (req,res) {
	// });
	app.get('/reg',function (req,res) {
		res.render('reg',{
			title:'Register',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});



	app.post('/reg',function (req,res) {
		var name = req.body.name,
			password = req.body.password,
			password_re = req.body['password-repeat'];
		// check the two password really as the same
		if (password_re != password) {
			console.log("twice password are not correct");
			req.flash('error','twice password are not correct');
			return res.redirect('/reg'); // return reg page
		}
		// get the password's md5
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name:name,
			password:password,
			email:req.body.email
		});	
		// check the user if exist
		User.get(newUser.name,function(err,user) {
			if(err) {
				console.log("error 1");
				req.flash('error',err);
				return res.redirect('/');
			}
			if(user) {
				console.log("user exist!");
				req.flash('error','user exist!');
				return res.redirect('/reg');
			}
			// new user
		newUser.save(function(err,user) {
				if(err) {
					req.flash('error',err);
					return res.redirct('/reg');
				}
				req.session.user = user; // 
				console.log("register success");
				req.flash('success','register success');
				res.redirect('/'); // return home page
			
			});
			
		});
	});
	app.get('/login',checkNotLogin);
	app.get('/login',function (req,res) {
		res.render('login',{
			title:'Login',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.post('/login',checkNotLogin);
	app.post('/login',function (req,res) {
		// generate md5 password
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		// check user if exist
		User.get(req.body.name,function (err,user) {
			if(!user) {
				req.flash('error',"password error");
				return res.redirect('/login');
			}
		// save user info to session
		req.session.user = user;
		req.flash('success','login success');
		res.redirect('/'); // goto home page
		}); 
	});
	app.get('/post',checkLogin);
	app.get('/post',function (req,res) {
		res.render('post',{
			title:'Post',
			user:req.session.user,
			success:req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.post('/post',checkLogin);
	app.post('/post',function (req,res) {
		var currentUser = req.session.user,
			post = new Post(currentUser.name,req.body.title,req.body.post);
		post.save(function (err) {
			if (err) {
				req.flash('error',err);
				return res.redirect('/'); 
			}
			req.flash('success','post success');
			res.redirect('/'); // goto home page
		});	
	});
	app.get('/logout',function (req,res) {
		req.session.user = null;	// clear user info in session
		req.flash('success','logout success');
		res.redirect('/');
	});

	function checkLogin(req,res,next) {
		if (!req.session.user) {
			req.flash('error','not login!');
			res.redirect('/login');
		}
		next();
	}

	function checkNotLogin(req,res,next) {
		if (req.session.user) {
			req.flash('error','login yet!');
			res.redirect('back'); // back to last page
		}
		next();
	}	
};

