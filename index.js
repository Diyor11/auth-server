const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 5000;
app.use(bodyParser.json())
app.use(cors({origin: 'http://localhost:3000'}))

const users = [
  {
    id: 1,
    username: 'hello',
    password: 'world',
    refreshToken: '66f977cf508d30f6c3c39791f829a7d007ab255ef0724bbaf19975f46e7bd8bffe037e2abe824571d58ac43e732214b662b9939440fe1b716d88d98648fef560'
  }
];

function getUserByUsername(username) {
  return users.find(user => user.username === username);
}

function getUserByRefreshToken(refreshToken) {
  
  return users.find(user => user.refreshToken === refreshToken);
}

function addUser(username, password) {
  const newUser = {
    id: users.length ? users[users.length - 1].id + 1 : 1,
    username,
    password: password, // Replace with hashing function
    refreshToken: generateRefreshToken(), // Replace with token generation function
  };
  users.push(newUser);
  return newUser;
}

function generateRefreshToken() {
  // Generate a cryptographically secure random string
  const randomBytes = crypto.randomBytes(64); // 64 bytes is a common length for refresh tokens
  return randomBytes.toString('hex');
}

// Replace with a secret key for JWT signing
const secretKey = 'your_secret_key';
const refreshSecretKey = 'your_refresh_secret_key'; // Different secret key for refresh token
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})
// Login user
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    

    const user = getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = password === user.password;
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate access token and refresh token
    const accessToken = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, refreshSecretKey, { expiresIn: '7d' });

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ... existing code

// Register user
app.post('/api/register', async (req, res) => {
  try {
    
    const { username, password } = req.body;

    const existingUser = getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const newUser = addUser(username, password);

    // Generate access token and refresh token
    const accessToken = jwt.sign({ userId: newUser.id }, secretKey, { expiresIn: '1h' });
    const refreshToken = newUser.refreshToken; // Use the generated refresh token
    console.log(users);
    
    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ... remaining code


// Refresh token
app.post('/api/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    const user = getUserByRefreshToken(refreshToken);
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }


    // Generate a new access token
    const accessToken = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });

    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Protected route (replace with your actual protected route logic)
app.get('/api/whoami', verifyToken, (req, res) => {
  const user = users.find(user => user.id === req.userId)
  if(!user) return res.status(404).json({message: 'User not found'}) 
  res.json({ data: user});
});

app.delete('/api/clear', (req, res) => {
  users = []
  res.status(200).json({message: "done"})
})

function verifyToken(req, res, next) {
  const authorization = req.headers.authorization;  
  const token = authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.decode(token, secretKey);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Forbidden' });
  }
}

app.listen(port, () => console.log(`Server listening on port ${port}`));
