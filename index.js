const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const ORGANIZATION_ID = '105738597'; // só o número
const ORGANIZATION_URN = `urn:li:organization:${ORGANIZATION_ID}`; // URN completo
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;

app.get('/api/posts', async (req, res) => {
  try {
    // Endpoint correto para buscar posts de uma organização (UGC)
    const response = await axios.get('https://api.linkedin.com/rest/ugcPosts', {
      headers: {
        Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'LinkedIn-Version': '202403', // Mantenha ou atualize conforme a documentação
        'X-Restli-Protocol-Version': '2.0.0'
      },
      params: {
        // Parâmetros corretos para filtrar por autor (organização)
        q: 'authors',
        authors: `List(${encodeURIComponent(ORGANIZATION_URN)})`, // URN da organização dentro de List() e codificado
        count: 10, // Número de posts a retornar
        sortBy: 'LAST_MODIFIED' // Ou 'CREATED' dependendo da API - ver documentação
        // 'sort' pode não ser o parâmetro correto aqui, 'sortBy' é comum
      }
    });

    // O mapeamento pode precisar de ajustes dependendo da estrutura da resposta de /ugcPosts
    // Verifique a estrutura de response.data.elements para /ugcPosts
    const posts = response.data.elements.map((item, i) => {
      // A estrutura do texto pode estar em 'specificContent.com.linkedin.ugc.ShareContent.shareCommentary.text'
      // ou similar, dependendo do tipo de post. Verifique a resposta da API.
      const text = item.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || item.commentary || 'Sem conteúdo';
      const createdAt = item.created?.time ? new Date(Number(item.created.time)).toISOString() : (item.firstPublishedAt ? new Date(Number(item.firstPublishedAt)).toISOString() : null);

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
    // Log adicional para debug
    if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
        console.error('Data:', error.response.data);
    } else if (error.request) {
        console.error('Request:', error.request);
    } else {
        console.error('Error message:', error.message);
    }
    res.status(error.response?.status || 500).json({ // Usar o status do erro se disponível
      error: 'Erro ao buscar posts do LinkedIn',
      message: error.message,
      linkedinError: error.response?.data
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});