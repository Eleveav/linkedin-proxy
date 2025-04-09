const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const ORGANIZATION_ID = '105738597'; // Seu ID de organização
const ORGANIZATION_URN = `urn:li:organization:${ORGANIZATION_ID}`; // URN completo
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN; // Seu token de acesso

// --- Rota da API ---
app.get('/api/posts', async (req, res) => {
  console.log(`Recebida requisição para /api/posts`);
  console.log(`Usando URN: ${ORGANIZATION_URN}`);
  console.log(`Usando Token: ${LINKEDIN_ACCESS_TOKEN ? 'Sim' : 'Não (Verifique .env)'}`);

  if (!LINKEDIN_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Token de acesso do LinkedIn não configurado.' });
  }

  try {
    console.log('Tentando chamar a API do LinkedIn...');
    const response = await axios.get('https://api.linkedin.com/rest/posts', { // Endpoint atualizado
      headers: {
        'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'LinkedIn-Version': '202503', // Versão atualizada
        'X-Restli-Protocol-Version': '2.0.0',
        // 'Accept': 'application/json' // Adicionar se necessário
      },
      params: {
        // Parâmetros para /rest/posts (VERIFICAR DOCUMENTAÇÃO v202503)
        author: ORGANIZATION_URN, // Parâmetro provável para filtrar por autor único
        count: 10,               // Quantidade de posts
        sortBy: 'LAST_MODIFIED'  // Ou 'CREATED' - verificar documentação
        // O parâmetro 'q' pode não ser necessário aqui quando 'author' é usado.
      }
    });

    console.log('Sucesso ao chamar a API. Status:', response.status);
    // console.log('Dados recebidos:', JSON.stringify(response.data, null, 2)); // Descomente para depuração detalhada

    // Mapeamento dos dados (AJUSTAR CONFORME A RESPOSTA REAL de /rest/posts v202503)
    // A estrutura exata pode variar. Verifique 'response.data.elements'.
    const posts = response.data.elements.map((item, i) => {
      // Tentativa de encontrar o texto: verificar 'commentary' ou outras estruturas aninhadas
      const text = item.commentary || item.text?.text || 'Sem conteúdo textual direto';

      // Tentativa de encontrar a data: verificar 'createdAt', 'created', 'firstPublishedAt'
      let createdAt = null;
      if (item.createdAt && typeof item.createdAt === 'number') { // Pode ser timestamp direto
         createdAt = new Date(item.createdAt).toISOString();
      } else if (item.created?.time && typeof item.created.time === 'number') { // Estrutura aninhada
         createdAt = new Date(item.created.time).toISOString();
      } else if (item.firstPublishedAt && typeof item.firstPublishedAt === 'number') {
         createdAt = new Date(item.firstPublishedAt).toISOString();
      }

      return {
        id: item.id || String(i), // 'id' deve existir na resposta
        title: text.slice(0, 60) + (text.length > 60 ? '...' : ''),
        content: text,
        createdAt: createdAt
      };
    });

    console.log(`Mapeados ${posts.length} posts.`);
    res.json(posts);

  } catch (error) {
    console.error('Erro detalhado ao buscar posts:');
    if (error.response) {
      // O servidor respondeu com um status fora do range 2xx
      console.error('Status do Erro:', error.response.status);
      console.error('Headers do Erro:', JSON.stringify(error.response.headers, null, 2));
      console.error('Dados do Erro:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Erro de Requisição:', error.request);
    } else {
      // Algo aconteceu ao configurar a requisição
      console.error('Erro na Configuração:', error.message);
    }
    // console.error('Config da Requisição Axios:', JSON.stringify(error.config, null, 2)); // Informação extra de debug

    res.status(error.response?.status || 500).json({
      error: 'Erro ao buscar posts do LinkedIn',
      message: error.message,
      linkedinError: error.response?.data // Mantém o erro específico do LinkedIn
    });
  }
});

// --- Inicialização do Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});