//jshint esversion:6
require('dotenv').config()
const express=require('express');
const mongoose=require('mongoose');
//md5 for hashing passwords
const md5=require('md5');
const app=express();
// const encrypt=require('mongoose-encryption');
const server='127.0.0.1:27017';
const db='usersDB';
// Set EJS as templating engine
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));

mongoose.connect(`mongodb://${server}/${db}`,{useNewUrlParser:true,useUnifiedTopology:true})
.then(()=>{
    console.log('db connected');
}).catch((err)=>{
    console.log(err);
});

const userSchema=new mongoose.Schema({
    email:String,
    password:String
});
//db encryption:
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields: ['password']});
const User=new mongoose.model('User',userSchema);




app.get('/',(req,res)=>{
    res.render('home');  
})
app.get('/login',(req,res)=>{
    res.render('login');  
})
app.post('/login',(req,res)=>{
    const username=req.body.username;
    const ps=md5(req.body.password);
    User.findOne({email:username},(err,foundRes)=>{
        if(!err){
            if(foundRes){
                if(foundRes.password===ps){
                res.render('secrets');
            }else{
                res.send('<h1>incorrect password</h1>');
            }
            }else{
                res.send('<h1>You are not registered.<br> Please <a class="btn btn-light btn-lg" href="/register" role="button">Register</a> here</h1>');
            }
        }else{
            console.log(err);
        }
    })
})
app.get('/register',(req,res)=>{
    res.render('register');  
});
app.post('/register',(req,res)=>{
    const email=req.body.username;
    const ps=md5(req.body.password);

    const user=new User({
        email:email,
        password:ps
    });
    user.save(function(err){
        if(err){
            console.log(err);
        }else{
            res.render('secrets');
        }
    })
})
app.get('/submit',(req,res)=>{
    res.render('submit');  
})

app.listen(3000,function(){
    console.log('server running on port 3000');
})