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
    const response = await axios({
      method: 'get',
      url: 'https://api.linkedin.com/rest/posts',
      headers: {
        Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'LinkedIn-Version': '202306',
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json'
      },
      params: {
        q: 'authors',
        authors: ORGANIZATION_URN,
        sort: 'RECENT',
        count: 10
      },
      paramsSerializer: params => {
        const searchParams = new URLSearchParams();
        for (const key in params) {
          if (Array.isArray(params[key])) {
            params[key].forEach(val => searchParams.append(key, val));
          } else {
            searchParams.append(key, params[key]);
          }
        }
        return searchParams.toString();
      }
    });

    const posts = response.data.elements.map((item, i) => {
      const text = item.text?.text || 'Sem texto';
      const createdAt = item.created?.time
        ? new Date(Number(item.created.time)).toISOString().split('T')[0]
        : 'Sem data';

      return {
        id: item.id || String(i),
        title: text.slice(0, 60) + (text.length > 60 ? '...' : ''),
        text,
        createdAt
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
