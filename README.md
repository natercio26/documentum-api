
# Documentum API

API com OCR (Tesseract.js) e GPT-4 para geração automática de minutas jurídicas.

## Como usar

1. Renomeie `.env.example` para `.env` e adicione sua chave da OpenAI.
2. Rode:

```bash
npm install
node index.js
```

3. Envie requisições `POST` para:

```
/api/gerar-minuta
```

Com:
- `documentos`: arquivos PDF/PNG
- `modelo`: string do template com variáveis ¿...>

---

Desenvolvido para integração com o projeto Documentum IA.
