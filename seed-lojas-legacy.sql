-- =============================================================
-- Seed de lojas legacy migradas para jebai_stores/_products
-- Gerado por scripts/extract-lojas-seed.py
-- =============================================================
-- IMPORTANTE: ajuste o owner_email abaixo se quiser que
-- alguém específico (não-admin) seja dono.
-- Idempotente: pode rodar múltiplas vezes (UPSERT por slug).
-- =============================================================

BEGIN;

-- ----- Loja: Atacado Connect (atacado-connect) — 8 produtos -----
DELETE FROM public.jebai_store_products WHERE store_id IN (SELECT id FROM public.jebai_stores WHERE slug = 'atacado-connect') AND origem = 'legacy_seed';
DELETE FROM public.jebai_stores WHERE slug = 'atacado-connect';
INSERT INTO public.jebai_stores (slug, owner_email, nome, descricao, cor_principal, status) VALUES ('atacado-connect', 'abraaosecundaria@hotmail.com', 'Atacado Connect', 'A maior loja de eletrônicos e acessórios de Ciudad del Este', '#1A5276', 'published');
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'iPhone 15 Pro Max 256GB', 'Titânio natural, chip A17 Pro', 'USD 1.099 — ou 12x sem juros', 0, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'atacado-connect';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Samsung Galaxy S24 Ultra', 'IA integrada, câmera 200MP', 'USD 899 — ou 10x sem juros', 1, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'atacado-connect';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'MacBook Air M3 13"', '8GB RAM, 256GB SSD', 'USD 1.299 — ou 12x sem juros', 2, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'atacado-connect';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'iPad Pro 11" M4', 'Display Ultra Retina XDR', 'USD 999 — ou 12x sem juros', 3, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'atacado-connect';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'AirPods Pro 2ª Geração', 'Cancelamento de ruído ativo', 'USD 179 — ou 6x sem juros', 4, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'atacado-connect';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'SSD Externo Samsung T7 1TB', 'USB 3.2, até 1050 MB/s', 'USD 89 — ou 3x sem juros', 5, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'atacado-connect';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Smartwatch Apple Watch S9', 'GPS, Retina sempre ativa', 'USD 399 — ou 6x sem juros', 6, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'atacado-connect';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Câmera Sony Alpha A7 IV', '33MP Full Frame, 4K 60fps', 'USD 2.499 — ou 12x sem juros', 7, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'atacado-connect';

-- ----- Loja: Atlântico Shop (atlantico) — 8 produtos -----
DELETE FROM public.jebai_store_products WHERE store_id IN (SELECT id FROM public.jebai_stores WHERE slug = 'atlantico') AND origem = 'legacy_seed';
DELETE FROM public.jebai_stores WHERE slug = 'atlantico';
INSERT INTO public.jebai_stores (slug, owner_email, nome, descricao, cor_principal, status) VALUES ('atlantico', 'abraaosecundaria@hotmail.com', 'Atlântico Shop', 'Eletrônicos, malas e ferramentas para toda necessidade', '#1A3D60', 'published');
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Mala Samsonite 28" Spinner', 'Rígida, 4 rodas, cadeado TSA', 'USD 159 — Garantia de fábrica', 0, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'atlantico';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Kit Ferramentas Bosch 50pcs', 'Chaves, brocas, acessórios pro', 'USD 89 — Profissional', 1, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'atlantico';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Notebook Dell Inspiron 15', 'i5 13ª, 16GB, 512GB SSD', 'USD 699 — Ou 12x sem juros', 2, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'atlantico';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Impressora Epson L3250', 'Multifuncional WiFi, tanque tinta', 'USD 199 — Bivolt automática', 3, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'atlantico';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Drone DJI Mini 4 Pro', '4K/60fps, 34 min voo, GPS', 'USD 759 — Drone profissional', 4, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'atlantico';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Mochila Targus 15.6"', 'Porta notebook, reforçada, USB', 'USD 49 — Resistente à água', 5, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'atlantico';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Roteador TP-Link AX3000', 'WiFi 6, dual band, até 3000Mbps', 'USD 89 — Longa cobertura', 6, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'atlantico';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Adaptador Universal Viagem', 'Funciona em 150+ países, 4 USB', 'USD 25 — Essencial viajante', 7, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'atlantico';

-- ----- Loja: best shop (best-shop) — 8 produtos -----
DELETE FROM public.jebai_store_products WHERE store_id IN (SELECT id FROM public.jebai_stores WHERE slug = 'best-shop') AND origem = 'legacy_seed';
DELETE FROM public.jebai_stores WHERE slug = 'best-shop';
INSERT INTO public.jebai_stores (slug, owner_email, nome, descricao, cor_principal, status) VALUES ('best-shop', 'abraaosecundaria@hotmail.com', 'best shop', 'Tecnologia, games e acessórios premium', '#1A4A7A', 'published');
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'PlayStation 5 Slim', 'Console + 1 controle DualSense', 'USD 449 — Pronta entrega', 0, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'best-shop';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Xbox Series X 1TB', 'Console + Game Pass 3 meses', 'USD 479 — Pronta entrega', 1, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'best-shop';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Nintendo Switch OLED', 'Tela OLED 7", portátil/TV', 'USD 329 — Pronta entrega', 2, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'best-shop';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'DualSense Edge', 'Controle PS5 Pro personalizável', 'USD 189 — Profissional', 3, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'best-shop';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Razer DeathAdder V3', 'Mouse gaming 30000 DPI', 'USD 79 — Top ranking', 4, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'best-shop';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'HyperX Cloud III', 'Headset gamer 7.1 surround', 'USD 99 — Melhor custo-benefício', 5, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'best-shop';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'FIFA 25 (PS5/Xbox)', 'Versão física lacrada', 'USD 59 — Lançamento', 6, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'best-shop';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Memória PS5 2TB NVMe', 'WD Black SN850X, PCIe 4.0', 'USD 139 — Amplie seu storage', 7, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'best-shop';

-- ----- Loja: bestfit Suplementos (bestfit) — 8 produtos -----
DELETE FROM public.jebai_store_products WHERE store_id IN (SELECT id FROM public.jebai_stores WHERE slug = 'bestfit') AND origem = 'legacy_seed';
DELETE FROM public.jebai_stores WHERE slug = 'bestfit';
INSERT INTO public.jebai_stores (slug, owner_email, nome, descricao, cor_principal, status) VALUES ('bestfit', 'abraaosecundaria@hotmail.com', 'bestfit Suplementos', 'Suplementação de alta performance para seu treino', '#7D3C98', 'published');
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Whey Gold Standard 5lbs', 'Optimum Nutrition, 24g proteína/dose', 'USD 79 — Melhor do mercado', 0, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'bestfit';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Creatina Monohidratada 500g', 'Muscle Pharm, 5g por dose, pura', 'USD 29 — Força e resistência', 1, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'bestfit';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Pre-Workout C4 Original', 'Cellucor, 60 doses, energia máxima', 'USD 39 — Top performance', 2, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'bestfit';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'BCAA Xtend 90 doses', 'Scivation, recuperação muscular', 'USD 49 — Aminoácidos essenciais', 3, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'bestfit';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Vitamina D3+K2 5000UI', 'Now Foods, 120 cápsulas, imunidade', 'USD 19 — Saúde e performance', 4, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'bestfit';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Omega 3 Fish Oil 180 caps', 'NOW Foods, 3g EPA/DHA por dose', 'USD 25 — Saúde cardiovascular', 5, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'bestfit';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Glutamina Pure 500g', 'Optimum Nutrition, recuperação pós-treino', 'USD 35 — Recuperação rápida', 6, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'bestfit';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Multivitamínico Adam Men', 'Now Foods, 90 cápsulas, completo', 'USD 22 — Nutrição completa', 7, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'bestfit';

-- ----- Loja: ⊕ DIOR (dior) — 8 produtos -----
DELETE FROM public.jebai_store_products WHERE store_id IN (SELECT id FROM public.jebai_stores WHERE slug = 'dior') AND origem = 'legacy_seed';
DELETE FROM public.jebai_stores WHERE slug = 'dior';
INSERT INTO public.jebai_stores (slug, owner_email, nome, descricao, cor_principal, status) VALUES ('dior', 'abraaosecundaria@hotmail.com', '⊕ DIOR', 'Perfumes e cosméticos de luxo no coração do Paraguai', '#8B1A1A', 'published');
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Sauvage EDP 100ml', 'Dior — Madeiroso Aromático Masculino', 'USD 89 — Best seller', 0, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'dior';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Miss Dior Blooming', 'Dior — Floral Feminino 100ml', 'USD 95 — Edição especial', 1, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'dior';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Chanel N°5 EDP 100ml', 'Chanel — O clássico intemporal', 'USD 120 — Ícone mundial', 2, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'dior';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Bleu de Chanel EDP', 'Chanel — Masculino sofisticado', 'USD 98 — Muito procurado', 3, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'dior';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Viktor&Rolf Flowerbomb', 'Feminino — Floriental 100ml', 'USD 85 — Edição limitada', 4, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'dior';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Tom Ford Black Orchid', 'Unisex — Oriental Floral 100ml', 'USD 130 — Luxo puro', 5, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'dior';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Lattafá Dual Mood EDP', 'Unisex — Oriental 100ml', 'USD 45 — Custo-benefício', 6, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'dior';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Carolina Herrera 212 VIP', 'Feminino — Gourmand 80ml', 'USD 75 — Top vendas', 7, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'dior';

-- ----- Loja: OneClick (oneclick) — 8 produtos -----
DELETE FROM public.jebai_store_products WHERE store_id IN (SELECT id FROM public.jebai_stores WHERE slug = 'oneclick') AND origem = 'legacy_seed';
DELETE FROM public.jebai_stores WHERE slug = 'oneclick';
INSERT INTO public.jebai_stores (slug, owner_email, nome, descricao, cor_principal, status) VALUES ('oneclick', 'abraaosecundaria@hotmail.com', 'OneClick', 'Tecnologia e soluções em um clique', '#1E8449', 'published');
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Pulverizador Nano 4.5 Pro', 'Spray nano tecnologia, 280ml, profissional', 'USD 35 — Top vendas profissional', 0, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'oneclick';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Kit Reparo Eletrônico 82pcs', 'Chaves de precisão, pinças, espátulas', 'USD 49 — Técnicos e entusiastas', 1, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'oneclick';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Multímetro Digital True RMS', 'AC/DC, frequência, temperatura', 'USD 59 — Alta precisão', 2, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'oneclick';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Estação Solda 60W Digital', 'Temperatura ajustável, ponteiras extra', 'USD 45 — Para técnicos', 3, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'oneclick';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Câmera Térmica FLIR One', 'Para smartphone, diagnóstico elétrico', 'USD 199 — Profissional', 4, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'oneclick';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Caneta de Teste Elétrico', 'Digital, LED, 12-220V, segura', 'USD 15 — Essencial eletricistas', 5, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'oneclick';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Limpa Contato Spray 300ml', 'Eletrônico, dieléctrico, seca rápido', 'USD 12 — Manutenção preventiva', 6, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'oneclick';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Alicate Crimpar RJ45/11', 'Kit com testador e conectores', 'USD 25 — Redes e telecom', 7, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'oneclick';

-- ----- Loja: USA Store (usa) — 8 produtos -----
DELETE FROM public.jebai_store_products WHERE store_id IN (SELECT id FROM public.jebai_stores WHERE slug = 'usa') AND origem = 'legacy_seed';
DELETE FROM public.jebai_stores WHERE slug = 'usa';
INSERT INTO public.jebai_stores (slug, owner_email, nome, descricao, cor_principal, status) VALUES ('usa', 'abraaosecundaria@hotmail.com', 'USA Store', 'Produtos importados direto dos Estados Unidos', '#B22222', 'published');
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'iPhone 15 256GB Desbloqueado', 'Versão americana, todas as bandas', 'USD 849 — Desbloqueado de fábrica', 0, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'usa';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Apple Watch Ultra 2', 'Titânio, GPS, 49mm', 'USD 699 — Edição americana', 1, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'usa';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Magic Liquid JMC-5050', 'Protetor de tela líquido premium', 'USD 29 — Best seller', 2, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'usa';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'PopSocket MagSafe', 'Suporte magnético premium', 'USD 25 — Compatível iPhone', 3, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'usa';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Anker 140W GaN Charger', 'Carregador ultra-rápido 3 portas', 'USD 55 — Tecnologia GaN', 4, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'usa';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Beats Studio Pro', 'Headphone premium Apple/Android', 'USD 249 — Cancelamento de ruído', 5, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'usa';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Tile Pro Rastreador', 'Bluetooth GPS, resistente água', 'USD 35 — Pack 2 unidades', 6, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'usa';
INSERT INTO public.jebai_store_products (store_id, nome, descricao, preco, ordem, origem) SELECT id, 'Belkin MagSafe 3in1', 'Carregador iPhone + Watch + AirPods', 'USD 79 — Carregamento rápido', 7, 'legacy_seed' FROM public.jebai_stores WHERE slug = 'usa';

COMMIT;

-- 7 lojas processadas.