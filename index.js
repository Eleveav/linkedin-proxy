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
        'LinkedIn-Version': '202403', // versão exigida pela nova API
        'X-Restli-Protocol-Version': '2.0.0',
        'Accept': 'application/json'
      },
      params: {
        q: 'authors',
        sort: 'RECENT',
        count: 10
      },
      paramsSerializer: params => {
        const searchParams = new URLSearchParams();
        searchParams.append('q', 'authors');
        searchParams.append('sort', 'RECENT');
        searchParams.append('count', '10');
        searchParams.append('authors', LINKEDIN_ORG_URN);
        return searchParams.toString();
      }
    });

    const posts = response.data.elements.map((item, i) => {
      const text = item.text?.body || 'Sem texto';
      const createdAt = item.created?.time || Date.now();
      const media = item.content?.media?.[0]?.url || null;

      return {
        id: item.id || String(i),
        title: text.slice(0, 60) + (text.length > 60 ? '...' : ''),
        content: text,
        date: new Date(createdAt).toISOString().split('T')[0],
        image: media
      };
    });

    res.json(posts);
  } catch (err) {
    console.error('Erro ao buscar posts:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Erro ao buscar posts do LinkedIn',
      message: err.message,
      linkedinError: err.response?.data || null
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
