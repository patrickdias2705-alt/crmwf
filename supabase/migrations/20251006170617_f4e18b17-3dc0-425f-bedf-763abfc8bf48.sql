-- Parte 1: Adicionar role de supervisor ao enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'supervisor';