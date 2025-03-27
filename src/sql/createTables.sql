-- Tabela de usuários (se tiver autenticação)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de fichários/binders
CREATE TABLE binders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de decks
CREATE TABLE decks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    format VARCHAR(50), -- Standard, Modern, Commander, etc
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de listas de compra
CREATE TABLE shopping_lists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de cartas (armazena metadados das cartas para evitar consultas repetidas ao Scryfall)
CREATE TABLE cards (
    id UUID PRIMARY KEY, -- Usando o ID do Scryfall como chave primária
    name VARCHAR(100) NOT NULL,
    set_code VARCHAR(20),
    collector_number VARCHAR(20),
    image_url TEXT,
    usd_price DECIMAL(10,2),
    eur_price DECIMAL(10,2),
    last_updated TIMESTAMP,
    scryfall_data JSONB -- Armazena todos os dados retornados pelo Scryfall
);

-- Tabela de relacionamento entre cartas e fichários
CREATE TABLE binder_cards (
    binder_id INTEGER REFERENCES binders(id),
    card_id UUID REFERENCES cards(id),
    quantity INTEGER DEFAULT 1,
    condition VARCHAR(20), -- NM, LP, MP, HP, etc
    notes TEXT,
    PRIMARY KEY (binder_id, card_id)
);

-- Tabela de relacionamento entre cartas e decks
CREATE TABLE deck_cards (
    deck_id INTEGER REFERENCES decks(id),
    card_id UUID REFERENCES cards(id),
    quantity INTEGER DEFAULT 1,
    is_sideboard BOOLEAN DEFAULT FALSE,
    notes TEXT,
    PRIMARY KEY (deck_id, card_id)
);

-- Tabela de relacionamento entre cartas e listas de compra
CREATE TABLE shopping_list_cards (
    list_id INTEGER REFERENCES shopping_lists(id),
    card_id UUID REFERENCES cards(id),
    quantity INTEGER DEFAULT 1,
    desired_condition VARCHAR(20),
    max_price DECIMAL(10,2),
    priority INTEGER DEFAULT 3, -- 1=Alta, 2=Média, 3=Baixa
    PRIMARY KEY (list_id, card_id)
);

-- Primeiro, remova a constraint atual se existir
ALTER TABLE deck_cards 
DROP CONSTRAINT IF EXISTS deck_cards_pkey;

-- Adicione a nova chave primária composta
ALTER TABLE deck_cards
ADD PRIMARY KEY (deck_id, card_id, is_sideboard);