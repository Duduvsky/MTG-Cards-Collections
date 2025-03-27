-- Inserir algumas cartas populares
INSERT INTO cards (id, name, set_code, image_url, usd_price, eur_price) VALUES
('a1b2c3d4-1234-5678-9012-abcdef123456', 'Tarmogoyf', 'mm3', 'https://img.scryfall.com/cards/normal/front/a/1/a1b2c3d4-1234-5678-9012-abcdef123456.jpg', 45.78, 38.20),
('b2c3d4e5-2345-6789-0123-bcdef1234567', 'Lightning Bolt', 'm10', 'https://img.scryfall.com/cards/normal/front/b/2/b2c3d4e5-2345-6789-0123-bcdef1234567.jpg', 1.50, 1.20),
('c3d4e5f6-3456-7890-1234-cdef12345678', 'Counterspell', '2xm', 'https://img.scryfall.com/cards/normal/front/c/3/c3d4e5f6-3456-7890-1234-cdef12345678.jpg', 2.30, 1.90);

-- Inserir um deck de teste
INSERT INTO decks (user_id, name, description, format) VALUES
(1, 'Modern Jund', 'Deck competitivo Modern', 'modern');

-- Inserir um fichário de teste
INSERT INTO binders (user_id, name, description) VALUES
(1, 'Cartas Valiosas', 'Minhas cartas mais raras');

-- Adicionar cartas ao deck
INSERT INTO deck_cards (deck_id, card_id, quantity, is_sideboard) VALUES
(1, 'a1b2c3d4-1234-5678-9012-abcdef123456', 4, false),
(1, 'b2c3d4e5-2345-6789-0123-bcdef1234567', 4, false);

-- Adicionar cartas ao fichário
INSERT INTO binder_cards (binder_id, card_id, quantity, condition, notes) VALUES
(1, 'a1b2c3d4-1234-5678-9012-abcdef123456', 2, 'NM', 'Edição Modern Masters'),
(1, 'c3d4e5f6-3456-7890-1234-cdef12345678', 1, 'LP', 'Versão Double Masters');