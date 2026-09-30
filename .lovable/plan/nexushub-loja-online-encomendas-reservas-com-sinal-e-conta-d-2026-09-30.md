# NexusHub: loja online, encomendas, reservas com sinal e conta do cliente

Este trabalho é grande, por isso vai ser feito em 4 fases. Cada fase fica a funcionar antes de passar à seguinte. Como o site ainda está em teste, os pagamentos são **simulados**: o pedido fica marcado como "Pago (teste)". Quando o site for lançado, liga-se o pagamento real.

## Fase 1: Loja online e carrinho
- A empresa cria produtos com várias fotos, descrição, preço, variantes (tamanho/cor), cada uma com o seu stock, e um alerta de stock mínimo.
- Página pública da loja em `/loja/:empresa`, com grelha de produtos, página de cada produto e escolha de variante.
- Carrinho flutuante (guardado no navegador, um por empresa) com subtotal automático.
- Entrega: envio para casa (com morada e portes definidos pela empresa) ou recolha na loja / takeaway.
- Finalizar compra: nome, email, telefone, morada de envio e de faturação, NIF opcional. O stock desce automaticamente e nunca é possível comprar mais do que o stock disponível.

## Fase 2: Gestão de encomendas (painel da empresa)
- Nova página "Encomendas" com separadores: Novos, Em Separação, Enviados/Prontos, Concluídos, Cancelados.
- Detalhe da encomenda: artigos, cliente, morada, transportadora (CTT, DPD, GLS, UPS, outra) e código de rastreio.
- Linha do tempo com cada mudança de estado, data e hora.
- Se uma encomenda for cancelada, o stock volta automaticamente.

## Fase 3: Reservas com sinal e venda de produtos
- Nas definições, a empresa escolhe: sem pagamento, sinal (% ou valor fixo) ou valor total.
- Reservas de mesas para restaurantes (número de pessoas), com os horários ocupados bloqueados em tempo real.
- Durante a reserva, o cliente pode juntar produtos da loja.
- Política de cancelamento: número de horas mínimo antes da hora marcada.

## Fase 4: Conta do cliente e painel financeiro
- Página "A Minha Conta": encomendas com barra de progresso atualizada em tempo real, histórico de reservas, detalhes de pagamento e cancelamento conforme a política da empresa.
- Painel financeiro: receita de produtos vs. serviços, gráfico por período e melhores produtos.
- Inventário com alertas de "Stock Crítico" e "Esgotado".
- Aviso com som e alerta visual no painel sempre que chega uma encomenda nova.

## Detalhes técnicos
- Novas tabelas: `products`, `product_variants`, `product_images`, `orders`, `order_items`, `order_status_history` e `company_settings` (portes, sinal, política de cancelamento, horários). Colunas novas em `appointments`: `party_size`, `deposit_amount`, `payment_status`, `order_id`. Cada tabela nova recebe GRANTs e RLS: o dono da empresa gere os seus dados, o cliente lê os seus e o público lê o catálogo.
- O checkout passa por uma função RPC `place_order` com SECURITY DEFINER, que valida e desconta o stock numa única transação (sem vendas acima do stock). Há também um trigger que regista as mudanças de estado e repõe o stock no cancelamento.
- As fotos ficam num novo bucket público `product-images`.
- Realtime ativo em `orders` e `appointments`, para os alertas do painel e o acompanhamento do cliente.
- Os pagamentos reais das empresas (cada uma recebe o seu dinheiro) ficam para depois dos testes.
