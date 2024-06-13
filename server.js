const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require('./serviceAccountKey.json');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
app.use(bodyParser.json());


const PORT = process.env.PORT || 3000;


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


app.get('/users', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/users/:id', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/users/cpf/:cpf', async (req, res) => {
  try {
    const snapshot = await db.collection('users').where('cpf', '==', req.params.cpf).get();
    if (snapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = snapshot.docs[0];
    res.status(200).json({ id: user.id, ...user.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inserir novos usuários
app.post('/users', async (req, res) => {
  try {
    const { name, email, cpf } = req.body;
    const newUser = await db.collection('users').add({ name, email, cpf });
    res.status(201).json({ id: newUser.id, name, email, cpf });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.put('/users/:id', async (req, res) => {
  try {
    const { name } = req.body;
    await db.collection('users').doc(req.params.id).update({ name });
    res.status(200).json({ id: req.params.id, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.delete('/users/:id', async (req, res) => {
  try {
    await db.collection('users').doc(req.params.id).delete();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
