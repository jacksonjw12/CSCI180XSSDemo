const express = require('express')
const app = express()


var session = require('express-session')

app.use(session({
  secret: 'aosdnaoisdiodankasndgjirnms',
  resave: true,
  saveUninitialized: false,
  cookie: { secure: false }
}))

app.use(express.json())
const { exec } = require('child_process');

var passwordHash = require('password-hash')

const port = 8088


let running = true;

let messages = []
let savedMessagesNum = 20;
let nextMessageNum = 0;

function addMessage(m){
	m.messageNum = nextMessageNum;
	nextMessageNum++;

	if(messages.length >= savedMessagesNum){
		messages.shift()
	}
	messages.push(m);


}
function getUnreadMessages(num){
	console.log("getting unread messages : ",num)
	console.log(messages)

	if(num === undefined || isNaN( num )){//initial page load
		console.log("test")
		return messages;
	}
	else{//refresh timeout
		let unreadMessages = []
		for(let i = messages.length-1; i>= 0; i--){
			if(messages[i].messageNum > num){
				unreadMessages.push(messages[i])
			}
			else{
				break;
			}
		}
		return unreadMessages;
	}
}

//{"user":"test","message":"test message","messageNumber":-1}

let users = []

//{userid:"FFFFFF", username:"username", "password":"passhash"}


app.get('/', (req, res) => {
	console.log(req.session.username)
	console.log(users)
	if(req.session.username){
		res.redirect('/messager')
	}
	else{
		res.sendFile(__dirname + '/public/index.html')

	}
})

app.get('/resetmessages',(req,res) => {
	messages = [];
	res.redirect('/')
})
app.get('/resetall',(req,res) => {
	messages = [];
	users = [];

	res.redirect('/')
})
app.get('/messager', (req, res) => {
	console.log(req.session.username)
	console.log(users)
	if(req.session.username){
		res.sendFile(__dirname + '/public/messager.html')
	}
	else{
		res.redirect('/')

	}
})

app.get('/logout', (req, res) => {
	req.session.destroy()
	res.redirect('/')
})


app.get('/login', (req, res) => {

	username = req.query.username;
	password = req.query.password;
	if(username === undefined || password === undefined || username === null || password === null || username.length === 0 || password.length === 0){
		res.send({"error":"bad or missing username or password"})
	}
	else{
		for(let u = 0; u< users.length; u++){
			if(users[u].username == username){
				// console.log("attempt login")
				// console.log(password)
				// console.log(users[u].password)
				// console.log(passwordHash.generate(password))
				// console.log(passwordHash.verify(password, users[u].password))
				// console.log("attempt login /")

				if(passwordHash.verify(password, users[u].password)){
					req.session.username = username
					req.session.userid = users[u].userid
					res.send({"success":"logged in"})
					return;
				}
				else{
					res.send({"error":"invalid username or password"})
				}


				break;
			}
		}



		res.send({"error":"invalid username or password"})
	}


})
function newId(){
	var letters = "0123456789ABCD"
	var color = "#"
	for (var i = 0; i < 6; i++)
       color += letters[(Math.floor(Math.random() * 14))];
    return color;
}

app.get('/signup', (req, res) => {
	username = req.query.username;
	password = req.query.password;
	//var hashedPassword = passwordHash.generate('password123');
	if(username === undefined || password === undefined || username === null || password === null || username.length === 0 || password.length === 0){
		res.send({"error":"bad or missing username or password"})
	}
	else{
		for(let u = 0; u< users.length; u++){
			if(users[u].username == username){
				res.send({"error":"that username already exists"})
				return;
			}
		}

		let newUser = {"userid":newId(), "username":username,"password":passwordHash.generate(password)}
		users.push(newUser);
		req.session.username = username
		req.session.userid = newUser.userid
		console.log("created new user")
		console.log(passwordHash.verify(password,newUser.password));
		//console.log(passwordHash.verify('password123', hashedPassword));

		res.send({"success":"signup up and logged in"})
	}


})


app.post('/sendMessage', (req, res) => {

	if(req.session.username == undefined){
		res.send({"error":"You must be logged in to send a message"})
	}
	else{
		if(req.body.message){
			addMessage({"message":req.body.message,"userid":req.session.userid})
			res.send({"success":"message body received"})
		}
		else{
			res.send({"error":"message body not received"})
		}
	}


})

app.get('/getMessages', (req, res) => {
	let messages;
	console.log(req.query.messageNum)
	messages = getUnreadMessages(req.query.messageNum)
	res.send({"messages":messages})
})

app.get('/getUserData', (req, res) => {
	if(req.session.username){
		res.send({"userid":req.session.userid,"username":req.session.username})

	}
	else{
		res.send({"userid":undefined,"username":undefined})

	}
})

app.use(express.static(__dirname + '/public'));


app.listen(port, () => console.log(`Example app listening on port ${port}!`))






