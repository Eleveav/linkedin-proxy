const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const ORGANIZATION_ID = '105738597'; // Seu ID de organização
const ORGANIZATION_URN = `urn:li:organization:${ORGANIZATION_ID}`; // URN completo
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;

app.get('/api/posts', async (req, res) => {
  try {
    // Usando o endpoint /rest/posts com parâmetros de busca por autor
    const response = await axios.get('https://api.linkedin.com/rest/posts', {
      headers: {
        Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'LinkedIn-Version': '202503', // Versão atualizada
        'X-Restli-Protocol-Version': '2.0.0',
        'X-RestLi-Method': 'FINDER' // Header necessário para busca com q=finderName
      },
      params: {
        q: 'author', // Especifica o tipo de busca (finder)
        author: ORGANIZATION_URN, // O URN da organização (axios codifica automaticamente, mas encodeURIComponent é mais seguro se construir URL manualmente)
        count: 10, // Número de posts
        isDsc: false // Parâmetro visto em exemplos, verificar necessidade/significado na doc oficial se houver problemas
        // sortBy: 'LAST_MODIFIED' // Ou 'CREATED'. Verificar na documentação se 'sortBy' é suportado por este finder.
      }
    });

    // Mapeamento da resposta - VERIFICAR A ESTRUTURA REAL RETORNADA PELA API v202503
    // A estrutura pode ter mudado. Use console.log(response.data.elements) para inspecionar.
    const posts = response.data.elements.map((item, i) => {
      // Tentar acessar o texto diretamente em 'commentary' ou dentro de 'specificContent'
      const text = item.commentary || item.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || 'Sem conteúdo';
      // Verificar a localização correta da data
      const createdAt = item.createdAt?.time ? new Date(Number(item.createdAt.time)).toISOString() : (item.firstPublishedAt ? new Date(Number(item.firstPublishedAt)).toISOString() : null);

      return {
        id: item.id || String(i), // O ID deve vir de item.id
        title: text.slice(0, 60) + (text.length > 60 ? '...' : ''),
        content: text,
        createdAt
      };
    });

    res.json(posts);
  } catch (error) {
    console.error('Erro ao buscar posts do LinkedIn:');
    // Log detalhado do erro da API do LinkedIn, se disponível
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Config:', JSON.stringify(error.config, null, 2)); // Loga a configuração da requisição axios
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Request error:', error.request);
    } else {
      // Erro ao configurar a requisição
      console.error('Error message:', error.message);
    }

    res.status(error.response?.status || 500).json({
      error: 'Erro ao buscar posts do LinkedIn',
      message: error.message,
      linkedinError: error.response?.data
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});