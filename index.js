
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/gerar-minuta', upload.array('documentos'), async (req, res) => {
  try {
    const arquivos = req.files;
    const modelo = req.body.modelo;

    if (!arquivos || arquivos.length === 0) {
      return res.status(400).json({ erro: 'Nenhum documento foi enviado.' });
    }

    if (!modelo) {
      return res.status(400).json({ erro: 'O modelo da minuta está ausente.' });
    }

    let textoExtraido = '';
    for (const arquivo of arquivos) {
      const resultado = await Tesseract.recognize(arquivo.path, 'por');
      textoExtraido += resultado.data.text + '\n';
      fs.unlinkSync(arquivo.path); // remove arquivo
    }

    const prompt = `Use o modelo abaixo com os campos entre ¿...> para gerar uma minuta com base nos documentos a seguir.\n\nModelo:\n${modelo}\n\nDocumentos OCR:\n${textoExtraido}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    const resposta = completion.choices[0].message.content;
    res.json({ minuta: resposta });

  } catch (err) {
    console.error('Erro ao gerar minuta:', err);
    res.status(500).json({ erro: 'Erro interno ao gerar a minuta.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
