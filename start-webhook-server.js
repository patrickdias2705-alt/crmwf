#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 Iniciando servidor de webhook...')

// Start the webhook server
const webhookServer = spawn('node', ['webhook-server.js'], {
  stdio: 'inherit',
  cwd: process.cwd()
})

webhookServer.on('error', (error) => {
  console.error('❌ Erro ao iniciar servidor de webhook:', error)
})

webhookServer.on('close', (code) => {
  console.log(`📡 Servidor de webhook finalizado com código: ${code}`)
})

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Finalizando servidor de webhook...')
  webhookServer.kill('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Finalizando servidor de webhook...')
  webhookServer.kill('SIGTERM')
  process.exit(0)
})
