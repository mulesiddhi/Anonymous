//jshint esversion:6
require('dotenv').config()
const express=require('express');
//bcrpyt for salting & hashing
// const bcrypt=require('bcrypt');
// const saltRounds = 10;
const mongoose=require('mongoose');
const session = require('express-session');
const passport=require('passport');
const passportLocalMongoose = require('passport-local-mongoose'); 
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate')
//md5 for hashing passwords
// const md5=require('md5');
const app=express();
// const encrypt=require('mongoose-encryption');
const server='127.0.0.1:27017';
const db='usersDB';
// Set EJS as templating engine
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));

//session
app.use(session({
    secret: 'thisisprivate',
    resave: false,
    saveUninitialized: false
  }));

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect(`mongodb://${server}/${db}`,{useNewUrlParser:true,useUnifiedTopology:true})
.then(()=>{
    console.log('db connected');
}).catch((err)=>{
    console.log(err);
});

const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String
});
//to hash and store the ps and save users in the db
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//db encryption:
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields: ['password']});


const User=new mongoose.model('User',userSchema);


passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/',(req,res)=>{
    res.render('home');  
})
app.get('/login',(req,res)=>{
    res.render('login');  
})
app.post('/login',(req,res)=>{
    // const username=req.body.username;
    // // const ps=md5(req.body.password);
    // User.findOne({email:username},(err,foundRes)=>{
    //     if(!err){
    //         if(foundRes){
    //             bcrypt.compare(req.body.password, foundRes.password, function(err, bresult) {
    //                 if( bresult === true){
    //                     res.render('secrets');
    //                 } else{
    //                     res.send('<h1>incorrect password</h1>');
    //                 }
    //             });   
    //         }else{
    //             res.send('<h1>You are not registered.<br> Please <a class="btn btn-light btn-lg" href="/register" role="button">Register</a> here</h1>');
    //         }
    //     }else{
    //         console.log(err);
    //     }
    // })

    const user = new User({
        username:req.body.username,
        password:req.body.password
    })
    //using log in function from passport
    req.logIn(user,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate('local')(req,res,()=>{
                res.redirect('/secrets');
            })
        }
    })
})
app.get('/register',(req,res)=>{
    res.render('register');  
});
app.post('/register',(req,res)=>{
    // const email=req.body.username;
    // const ps=md5(req.body.password);

    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     // Store hash in your password DB.
    //     const user=new User({
    //         email:req.body.username,
    //         password:hash
    //     });
    //     user.save(function(err){
    //         if(err){
    //             console.log(err);
    //         }else{
    //             res.render('secrets');
    //         }
    //     })
    // });
    
    User.register({username:req.body.username},req.body.password,(err,user)=>{
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate('local')(req,res,()=>{
                res.redirect('/secrets');
            })
        }
    })
})

app.get('/secrets',(req,res)=>{
   
    //if user is already logged in then render this page or else register page
    if(req.isAuthenticated()){
        res.render('secrets'); 
    }else{
        res.redirect('/login'); 
    }
})

app.get('/submit',(req,res)=>{
    res.render('submit');  
})

app.get('/logout',(req,res)=>{
    //log out function from passport.js
    req.logout();
    res.redirect('/');
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
  );

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
app.listen(3000,function(){
    console.log('server running on port 3000');
})