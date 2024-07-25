const jwt = require('jsonwebtoken')
console.log(jwt.verify("eyJ1c2VySWQiOjEsImlhdCI6MTcyMTkxNjE1NCwiZXhwIjoxNzIxOTE5NzU0fQ", 'your_secret_key'));
