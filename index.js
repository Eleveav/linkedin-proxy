const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const ORGANIZATION_URN = 'urn:li:organization:105738597';

app.get('/api/posts', async (req, res) => {
  try {
    const response = await axios.get('https://api.linkedin.com/rest/posts', {
      headers: {
        Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'LinkedIn-Version': '202403',
        'X-Restli-Protocol-Version': '2.0.0',
        Accept: 'application/json',
      },
      params: {
        q: 'authors',
        authors: [ORGANIZATION_URN],
        sort: 'RECENT',
        count: 10
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
