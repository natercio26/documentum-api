require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse'); // substituto do pdf-poppler
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/gerar-minuta', upload.array('documentos'), async (req, res) => {
  try {
    const arquivos = req.files;
    const modelo = req.body.modelo || '';

    if (!arquivos || arquivos.length === 0) {
      return res.status(400).json({ erro: 'Nenhum documento enviado.' });
    }

    let textoExtraido = '';

    for (const arquivo of arquivos) {
      const ext = path.extname(arquivo.originalname).toLowerCase();

      if (ext === '.pdf') {
        const buffer = fs.readFileSync(arquivo.path);
        const data = await pdfParse(buffer);
        textoExtraido += data.text + '\n';
        fs.unlinkSync(arquivo.path);
      } else {
        const result = await Tesseract.recognize(arquivo.path, 'por');
        textoExtraido += result.data.text + '\n';
        fs.unlinkSync(arquivo.path);
      }
    }

    const prompt = `Use o modelo abaixo com os dados extraídos dos documentos para gerar uma minuta jurídica:\n\nMODELO:\n${modelo}\n\nDADOS:\n${textoExtraido}`;

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
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
