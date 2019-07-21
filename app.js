const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const TWO_HOURS = 1000* 60 * 60 *2

const {
    PORT = 3000,
    NODE_ENV = 'development',
    SESS_LIFETIME = TWO_HOURS,
    SESS_NAME = 'sid',
    SESS_SECRET = 'ssh!quiet,it/is secret'
} = process.env;


const IN_PROD = NODE_ENV === 'production';


const users=[
    {id:1, name:'Alex',email:'alex@gmail.com',password:'test'},
    {id:2, name:'Bach',email:'bach@gmail.com',password:'bachismusic'},
    {id:3, name:'Charlie',email:'charlie@gmail.com',password:'thisischalie'},
    {id:4, name:'Dima',email:'dima@gmail.com',password:'privet'},
]
const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    name: SESS_NAME,
    resave: false,
    saveUninitialized:false,
    secret:SESS_SECRET, //key to sign the cookie
    cookie:{
        maxAge:SESS_LIFETIME,
        sameSite: true,
        secure: IN_PROD
    }
}))
const redirectLogin = (req,res,next)=>{
    if(!req.session.userID){
    res.redirect('/login')
    }else{
        next();
    }
}
const redirectHome = (req,res,next)=>{
    if(req.session.userID){
        res.redirect('/home')
    }else{
        next();
    }
}

app.use((req,res,next)=>{
    const {userID} = req.session;
    if(userID){
        res.locals.user = users.find(user => user.id ===userID);
    }
    next();
})

app.get('/',(req,res)=>{
    const userID = req.session.userID;
    res.send(`
        <h1>Welcome!</h1>
        ${userID? `
        <a href='/home'>Home</a>
        <form method='post' type='submit' action='/logout'>
          <button>Logout</button>
        </form>`
        :
        `        
        <a href='/login'>Login</a>
        <a href='/register'>Register</a>`
    }

        
    `);
})

app.get('/home',redirectLogin,(req,res)=>{
const {user} = res.locals

    res.send(`
    <h1>Home</h1>
    <a href='/'>Main</a>
    <ul>
    <li>Name:${user.name}</li>
    <li>Email:${user.email}</li>
    </ul>
    `);
})

app.get('/profile',(req,res)=>{
    const {user} = res.locals;
}
)

app.get('/login',redirectHome,(req,res)=>{
    res.send(`
    <h1>Login</h1>
    <form method='post' action='/login' />
        <input type='email' name='email' placeholder='Email' required/>
        <input type='password' name='password' placeholder='Password' required/>
        <input type='submit' />
    </form>
    <a href='/register'>Register</a>
    `)
});

app.get('/register',redirectHome,(req,res)=>{
    res.send(`
    <h1>Register</h1>
    <form method='post' action='/register' >
        <input name='name' placeholder='Name' required/>
        <input type='email' name='email' placeholder='Email' required/>
        <input type='password' name='password' placeholder='Password' required/>
        <input type='submit' />
    </form>
    <a href='/login'>Login</a>
    `)
})


app.post('/login',redirectHome,(req,res)=>{//22:33
 const { email,password } =req.body;//Because we have bodyparser, we can access req object
 if(email && password){
     const user = users.find(user => user.email === email && user.password ===password)// TODO:HASH
     if (user){
         //create cookie
         req.session.userID=user.id;
         return res.redirect('/home');
     }
 }
 res.redirect('/login');
})

app.post('/register',redirectHome,(req,res)=>{
 const { name,email,password } =req.body;

 if(name&&email&&password)//TODO:HASH
 {
     const exists = users.some(
         user => user.email === email
     )


     if(!exists){
         const user = {
             id: users.length + 1,
             name ,
             email,
             password
         }
         users.push(user);
         req.session.userID = user.id;
         return res.redirect('/home');
     }
 }
 res.redirect('/register') //TODO:query /register?error=error.auth.email.TooShort
})


app.post('/logout',redirectLogin,(req,res)=>{
    req.session.destroy(err=>{
        if(err){
            return res.redirect('/home');
        }
        res.clearCookie(SESS_NAME);
        res.redirect('/login');
        })
})

app.listen(PORT, ()=>{
    console.log(`Listening on http://localhost:${PORT}/`);
});