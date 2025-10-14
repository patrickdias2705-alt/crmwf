-- Adicionar ON DELETE CASCADE para permitir exclusão de leads com dados relacionados

-- Remover constraint antiga e adicionar nova com CASCADE para budgets
ALTER TABLE public.budgets 
DROP CONSTRAINT IF EXISTS budgets_lead_id_fkey;

ALTER TABLE public.budgets
ADD CONSTRAINT budgets_lead_id_fkey 
FOREIGN KEY (lead_id) 
REFERENCES public.leads(id) 
ON DELETE CASCADE;

-- Remover constraint antiga e adicionar nova com CASCADE para activities
ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS activities_lead_id_fkey;

ALTER TABLE public.activities
ADD CONSTRAINT activities_lead_id_fkey 
FOREIGN KEY (lead_id) 
REFERENCES public.leads(id) 
ON DELETE CASCADE;

-- Remover constraint antiga e adicionar nova com CASCADE para lead_events
ALTER TABLE public.lead_events 
DROP CONSTRAINT IF EXISTS lead_events_lead_id_fkey;

ALTER TABLE public.lead_events
ADD CONSTRAINT lead_events_lead_id_fkey 
FOREIGN KEY (lead_id) 
REFERENCES public.leads(id) 
ON DELETE CASCADE;

-- Remover constraint antiga e adicionar nova com CASCADE para messages
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_lead_id_fkey;

ALTER TABLE public.messages
ADD CONSTRAINT messages_lead_id_fkey 
FOREIGN KEY (lead_id) 
REFERENCES public.leads(id) 
ON DELETE CASCADE;

-- Remover constraint antiga e adicionar nova com CASCADE para conversations
ALTER TABLE public.conversations 
DROP CONSTRAINT IF EXISTS conversations_lead_id_fkey;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_lead_id_fkey 
FOREIGN KEY (lead_id) 
REFERENCES public.leads(id) 
ON DELETE CASCADE;