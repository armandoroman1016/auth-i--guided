const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const db = require('./database/dbConfig.js');
const Users = require('./users/users-model.js');
const bcrypt = require('bcryptjs')

const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());

server.get('/', (req, res) => {
  res.send("It's alive!");
});

server.post('/api/register', (req, res) => {
  let user = req.body;

  const hash = bcrypt.hashSync(user.password, 8);

  Users.add({...user, password:hash})
    .then(saved => {
      res.status(201).json(saved);
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

server.post('/api/login', (req, res) => {
  let { username, password } = req.body;

  Users.findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        res.status(200).json({ message: `Welcome ${user.username}!` });
      } else {
        res.status(401).json({ message: 'Invalid Credentials' });
      }
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

server.get('/api/users', (req, res) => {
  Users.find()
    .then(users => {
      res.json(users);
    })
    .catch(err => res.send(err));
});

server.get('/hash', (req, res) => {
  let name = req.query.name;
  // hash the name
  const hash = bcrypt.hashSync(name, 14); // use bcryptjs to hash the name

  res.send(`the hash for ${name} is ${hash}`);
});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`\n** Running on port ${port} **\n`));


function restricted(req, res, next){
  const {username, password} = req.headers;

  if(username && password){
    Users.findBy({username})
      .first()
      .then( user =>{
        if(user && bcrypt.compareSync(user.password && password)){
          next();
        }else{
          res.status(401).json({message: 'Invalid Credentials'})
        }
      })
      .catch( err => res.status(500).json(err))
  }else{
    res.status(400).json({message: 'missing credentials'})
  }
}