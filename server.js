const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Banco de Dados
const db = new sqlite3.Database('./banco.db');

// Configurar Express
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // aceitar JSON
app.use(express.static(path.join(__dirname, 'public')));

// Criação das tabelas (se não existirem)
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuario (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    senha TEXT NOT NULL,
    telefone TEXT NOT NULL,
    endereco TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS instituicao (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    senha TEXT NOT NULL,
    telefone TEXT NOT NULL,
    endereco TEXT NOT NULL
  )`);
});

// Rotas

// Página inicial
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Página de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Página de cadastro
app.get('/cadastro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cadastro.html'));
});

// Página Home (nova)
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// API para buscar dados dos usuários e instituições (nova)
app.get('/dados', (req, res) => {
  const usuarios = [];
  const instituicoes = [];

  db.all(`SELECT * FROM usuario`, [], (err, rowsUsuario) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Erro ao buscar usuários' });
    }

    usuarios.push(...rowsUsuario);

    db.all(`SELECT * FROM instituicao`, [], (err, rowsInstituicao) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Erro ao buscar instituições' });
      }

      instituicoes.push(...rowsInstituicao);

      res.json({ usuarios, instituicoes });
    });
  });
});

// Cadastro de usuário ou instituição
app.post('/cadastrar', (req, res) => {
  const { tipo, id, nome, email, senha, telefone, endereco } = req.body;

  console.log('Dados recebidos:', req.body);

  if (!tipo || !id || !nome || !email || !senha || !telefone || !endereco) {
    return res.send('Preencha todos os campos.');
  }

  if (tipo === 'usuario') {
    db.run(
      `INSERT INTO usuario (id, nome, email, senha, telefone, endereco) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, nome, email, senha, telefone, endereco],
      function (err) {
        if (err) {
          console.error(err.message);
          return res.send('Erro ao cadastrar usuário. CPF já cadastrado?');
        } else {
          console.log('Usuário cadastrado com sucesso!');
          return res.send('Usuário cadastrado com sucesso!');
        }
      }
    );
  } else if (tipo === 'instituicao') {
    db.run(
      `INSERT INTO instituicao (id, nome, email, senha, telefone, endereco) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, nome, email, senha, telefone, endereco],
      function (err) {
        if (err) {
          console.error(err.message);
          return res.send('Erro ao cadastrar instituição. CNPJ já cadastrado?');
        } else {
          console.log('Instituição cadastrada com sucesso!');
          return res.send('Instituição cadastrada com sucesso!');
        }
      }
    );
  } else {
    res.send('Tipo inválido.');
  }
});

// Login de usuário ou instituição (alterado)
app.post('/login', (req, res) => {
  const { tipo, id, senha } = req.body;

  if (!tipo || !id || !senha) {
    return res.json({ sucesso: false, mensagem: 'Preencha todos os campos.' });
  }

  const tabela = (tipo === 'usuario') ? 'usuario' : 'instituicao';

  db.get(`SELECT * FROM ${tabela} WHERE id = ? AND senha = ?`, [id, senha], (err, row) => {
    if (err) {
      console.error('Erro no login:', err.message);
      return res.json({ sucesso: false });
    }

    if (row) {
      // Login válido → Redirecionar para home
      return res.json({ sucesso: true, redirecionar: '/home' });
    } else {
      return res.json({ sucesso: false });
    }
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
