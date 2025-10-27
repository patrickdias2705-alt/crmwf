FROM node:18-alpine

WORKDIR /app

# Copiar package.json primeiro para cache de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install --production

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3001

# Comando de inicialização
CMD ["npm", "start"]
