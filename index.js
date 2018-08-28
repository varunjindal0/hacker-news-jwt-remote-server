/**
 * To get started install
 * express bodyparser jsonwebtoken express-jwt
 * via npm
 * command :-
 * npm install express bodyparser jsonwebtoken express-jwt --save
 */

// https://hptechblogs.com/using-json-web-token-for-authentication/


// Bringing all the dependencies in
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const exjwt = require('express-jwt');
const mongoose = require('mongoose');

// Instantiating the express app
const app = express();


// See the react auth blog in which cors is required for access
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Headers', 'Content-type,Authorization');
    next();
});

// Setting up bodyParser to use json and set it to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// INstantiating the express-jwt middleware
const jwtMW = exjwt({
    secret: 'my secret'
});


mongoose.connect('mongodb://varun:samsung03@ds119662.mlab.com:19662/hacker-news-db');
var userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    postsLiked: []
  })
  var User = mongoose.model('user', userSchema);
  User.find({}, function(err, users){
    if(err){
      console.log("There is an error fetching data from database!!")
      console.log(err);
    } else {
      console.log("All the Users!");
      console.log(users);
    }
  })

var upvoteSchema = new mongoose.Schema({
    postId: String,
    ourScore: String
})
var UpVote = mongoose.model('upvote', upvoteSchema)
UpVote.find({}, function(err, postScores){
    if(err){
        console.log("There is an error fetching data from database!!")
        console.log(err);
      } else {
        console.log("All the Post-Scores in our DB");
        console.log(postScores);
      }
})

// LOGIN ROUTE
app.post('/login', (req, res) => {
    console.log("-------------------------------------------------------")
    const { username, password } = req.body;
    console.log("++++++++++++++++++++++++"+username)
    console.log(req.body.username);
    
    User.find({}, function(err, users){
        if(err){
          console.log("There is an error fetching data from database!!")
          console.log(err);
        } else {
            let failure = 'true'
          for(let user of users){
              if(username===user.username && password=== user.password){
                  failure = 'false'
                  let token = jwt.sign({username: user.username, user_db_id: user._id}, 'my secret', { expiresIn: 129600 })
                  res.json({
                      success: true,
                      err: null,
                      token
                  })
                  break;
              }
          }
          if(failure==='true'){
            res.status(401).json({
                sucess: false,
                token: null,
                err: 'Username or password is incorrect'
            });
          }
          
        }
      })

    

});

app.post('/register', (req, res)=>{
    console.log("I /register post was called!!")
    var newUser = new User({username: req.body.username, email: req.body.email, password: req.body.password});
    console.log(newUser);
    User.find({username: req.body.username}, function(err, user){
        if (err){
            console.log(err)
        } else {
            console.log(user)
            if(user.length===0){
                if(!req.body.password===req.body.confirmpassword){
                    res.send("Passwords does not match!!")
                } else {
                    newUser.save(function(err, savedUser){
                        if(err){
                            console.log("Error saving in database!")
                            res.send(err);
                        } else {
                            console.log("User successfully registered!!"+ user.username + user._id);
                            let token = jwt.sign({username: savedUser.username, user_db_id: savedUser._id}, 'my secret', { expiresIn: 129600 })
                            res.json({
                                success: true,
                                err: null,
                                token
                            })
                        }
                    })
                  }
            } else {
                res.send('user already exists!!');
            }
        }
    })
    
})

//************************************************* */

app.post('/upvote', jwtMW ,(req, res)=>{
    let upVoteWeight = '50'
    console.log(req.body.postId);
    console.log('user_db_id: '+req.body.user_db_id)
    var newUpVote = new UpVote({postId: req.body.postId, ourScore: req.body.ourScore});
    // postsLiked.push(req.body.postId)
    if(req.body.ourScore===upVoteWeight){
        User.update({_id: req.body.user_db_id}, {$push: {postsLiked: req.body.postId}}, function(err){
            if(err){
                console.log(err)
                res.json(err);
            } else {
                console.log('user with id: '+req.body.user_db_id+'likes post with id: '+req.body.postId)
            }
        })
    } else {
        User.update({_id: req.body.user_db_id}, {$pull: {postsLiked: req.body.postId}}, function(err){
            if(err){
                console.log(err)
                res.json(err);
            } else {
                console.log('user with id: '+req.body.user_db_id+'UNLIKED post with id: '+req.body.postId)
            }
        })
    }
    
    UpVote.findOne({postId: req.body.postId}, function(err, post){
        if(err){
            console.log(err)
            res.send(err);
        } else {
            if(post===null){
                newUpVote.save(function(err){
                    if(err){
                        console.log(err)
                        res.send(err)
                    } else {
                        console.log("New Post Score added successfully!!")
                        res.json({success: true, message: "New Post Score added successfully!!"})
                    }
                })
            } else {
                UpVote.update({postId: post.postId}, {ourScore: (parseInt(post.ourScore)+parseInt(req.body.ourScore))}, function(err){
                    if(err){
                        console.log(err);
                        res.send(err);
                    } else {
                        console.log("Existing Post Updated Successfully!!")
                        res.json({success: true, message: "Existing Post Updated Successfully!!"})
                    }
                })
            }
        }
    })
})

app.get('/upvotes/:id', (req, res)=>{
    console.log(req.params.id);
    UpVote.findOne({postId: req.params.id}, function(err, post){
        if(err){
            console.log(err);
            res.send(err);
        } else{
            if(post===null){
                res.json({postId: req.params.id, ourScore: 0})
            } else {
                res.json({postId: post.postId, ourScore: post.ourScore})
            }
        }
    })
})

app.get('/', jwtMW /* Using the express jwt MW here */, (req, res) => {
    res.send('You are authenticated'); //Sending some response when authenticated
});

app.get('/:user_db_id/voted', jwtMW, (req,res)=>{
    console.log("Fetching all the posts liked by this userID: "+ req.params.user_db_id);
    console.log("jwt info: "+req.user)
    let arr = [];
    User.findOne({_id: req.params.user_db_id}, function(err, user){
        if(err){
            res.send(err);
        } else {
            res.json(user.postsLiked);
        }
    })
})

// Error handling 
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') { // Send the error rather than to show it on the console
        res.status(401).send(err);
    }
    else {
        next(err);
    }
});

// Starting the app on PORT 8080
const PORT = 8080;
app.listen(PORT, () => {
    // eslint-disable-next-line
    console.log(`Magic happens on port ${PORT}`);
});