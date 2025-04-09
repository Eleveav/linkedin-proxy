const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const LINKEDIN_ORG_URN = 'urn:li:organization:105738597';
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;

app.get('/api/posts', async (req, res) => {
  try {
    const response = await axios.get('https://api.linkedin.com/rest/posts', {
      headers: {
        Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'LinkedIn-Version': '202403',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      params: {
        q: 'authors',
        authors: [LINKEDIN_ORG_URN],
        sort: 'RECENT',
        count: 10
      }
    });

    const posts = response.data.elements.map((item, i) => {
      const text = item.text?.text || 'Sem conteúdo';
      const createdAt = item.created?.time ? new Date(Number(item.created.time)).toISOString() : null;

      return {
        id: item.id || String(i),
        title: text.slice(0, 60) + (text.length > 60 ? '...' : ''),
        content: text,
        createdAt
      };
    });

    res.json(posts);
  } catch (error) {
    console.error('Erro ao buscar posts:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Erro ao buscar posts do LinkedIn',
      message: error.message,
      linkedinError: error.response?.data
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
