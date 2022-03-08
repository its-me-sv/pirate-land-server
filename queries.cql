CREATE TABLE users (
    id UUID,
    name TEXT,
    username TEXT,
    password_hash TEXT,
    created_at TIMEUUID,
    current_game UUID,
    PRIMARY KEY (username, id)
);
ALTER TABLE users ADD games LIST<TIMEUUID>;
CREATE CUSTOM INDEX users_id_index on users (id) USING 'StorageAttachedIndex';
CREATE CUSTOM INDEX users_games_index on users (games) USING 'StorageAttachedIndex';
CREATE TABLE tokens (
    id UUID,
    tkn TEXT,
    PRIMARY KEY (id)
);
CREATE TABLE sockets (
    id UUID,
    socket_id TEXT,
    PRIMARY KEY (id)
);
CREATE CUSTOM INDEX sockets_socket_id_index on sockets (socket_id) USING 'StorageAttachedIndex';
CREATE TABLE games (
    id TIMEUUID,
    team1 UUID,
    team2 UUID,
    is_ended BOOLEAN,
    chance_of UUID,
    PRIMARY KEY (id)
);
CREATE TABLE teams (
    id UUID,
    players LIST<UUID>,
    created_at TIMEUUID,
    PRIMARY KEY (id)
);
CREATE TABLE messages (
    id UUID,
    chat_id UUID,
    sender_id UUID,
    message TEXT,
    created_at TIMEUUID,
    PRIMARY KEY ((id, chat_id), created_at)
) WITH CLUSTERING ORDER BY (created_at DESC);
CREATE TABLE boards (
    id UUID,
    board TEXT,
    PRIMARY KEY (id)
);
CREATE TYPE score (
    pid UUID,
    captures INT,
    caught INT
);
CREATE TABLE scoreboards (
    id TIMEUUID,
    team1 LIST<FROZEN<score>>,
    team2 LIST<FROZEN<score>>,
    created_at TIMEUUID,
    PRIMARY KEY (id)
);