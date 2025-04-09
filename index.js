const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/api/posts', async (req, res) => {
  res.json([
    {
      id: '1',
      title: 'Post exemplo da Vasconcelos Advocacia',
      content: 'Este é um post exibido via backend Render!',
      date: '2025-04-01',
    }
  ]);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
