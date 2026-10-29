# NexusHub — Próxima fase: completar, testar e polir

Mantém a ideia: SaaS multi-empresa (lojas, restaurantes, barbearias) com loja online, encomendas e reservas 100% dentro do site, sem WhatsApp. Pagamentos continuam simulados (versão de teste).

## 1. Terminar as reservas (o que ficou a meio)
- Página de reserva nova: escolher serviço, dia e hora com base nos horários reais da empresa; horários ocupados ficam bloqueados.
- Restaurantes: perguntar número de pessoas.
- Mostrar e registar o sinal (conforme definido pela empresa) com pagamento simulado.
- "Juntar à reserva": sugerir produtos da loja da empresa e incluí-los na mesma compra.
- Ecrã de confirmação com resumo e botão "Adicionar ao calendário".

## 2. Agenda da empresa profissional
- Vista Lista / Calendário semanal / Quadro por estado (Pendente, Confirmado, Em atendimento, Concluído, Cancelado).
- Ações rápidas: confirmar, concluir, cancelar, faltou.
- Alerta com som quando chega nova reserva (como já acontece com encomendas).

## 3. Clientes (CRM)
- Ficha do cliente com histórico de compras e reservas, total gasto, última visita e notas internas.
- Filtros: frequentes, novos, inativos.

## 4. Página pública da empresa
- Capa, logo, descrição, horário, morada, separadores Loja / Serviços / Reservar num só sítio.
- Definições para a empresa carregar capa e escrever descrição.

## 5. Painel inicial com números reais
- Faturação de hoje/semana/mês, reservas do dia, encomendas por tratar, ticket médio, stock crítico.

## 6. Qualidade e acabamento
- Teste completo no site: criar empresa, produtos, serviços; entrar como cliente, comprar, reservar; ver tudo no painel e em "A minha conta". Corrigir tudo o que falhar.
- Design consistente (cores do tema, estados vazios, carregamentos), pensado primeiro para telemóvel.
- Título e descrição do site corretos para partilha.

## Detalhes técnicos
- Reescrever `Schedule.tsx` usando `get_booked_slots`, `company_settings` (open/close/slot), `computeDeposit`; criar encomenda `kind='booking'` via `place_order` e ligar `appointments.order_id`, `deposit_amount`, `party_size`, `payment_status='paid_test'`.
- Migração: `companies.banner_url`, `companies.description`; `customer_notes` (company_id, customer_user_id/email, note) com RLS só para donos; adicionar estado `no_show` às reservas; realtime para appointments no `DashboardLayout`.
- Appointments/Customers/Dashboard passam a usar `DashboardLayout` e tokens semânticos (remover `bg-gray-*`, `text-gray-*`).
- Verificação com Playwright em 360px e 1280px, com sessão de empresa e de cliente.
- Atualizar `index.html` (title, description, og/twitter) e `AGENTS.md`.
