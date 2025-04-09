const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const LINKEDIN_ORG_URN = 'urn:li:organization:105738597';
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN; // coloque no .env

app.get('/api/posts', async (req, res) => {
  try {
    const response = await axios.get('https://api.linkedin.com/v2/ugcPosts', {
      headers: {
        Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`
      },
      params: {
        q: 'authors',
        authors: LINKEDIN_ORG_URN,
        count: 10,
        sortBy: 'LAST_MODIFIED'
      }
    });

    const posts = response.data.elements.map((item, i) => {
      const content = item.specificContent['com.linkedin.ugc.ShareContent'];
      const text = content.shareCommentary?.text || 'Sem texto';
      const createdAt = new Date(Number(item.created.time)).toISOString().split('T')[0];
      const media = content.media?.[0]?.thumbnails?.[0]?.resolvedUrl || null;

      return {
        id: item.id || String(i),
        title: text.slice(0, 60) + (text.length > 60 ? '...' : ''),
        content: text,
        date: createdAt,
        image: media
      };
    });

    res.json(posts);
  } catch (err) {
    console.error('Erro ao buscar posts:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao buscar posts do LinkedIn' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
