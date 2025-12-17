-- ===== extensiony (pokud nejsou) =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== enumerace =====
CREATE TYPE registration_status AS ENUM ('saved', 'submitted', 'cancelled');

-- ===== uživatelé a role =====
CREATE TABLE "user_account" (
                            user_id        BIGSERIAL PRIMARY KEY,
                            first_name     VARCHAR(100),
                            last_name      VARCHAR(100),
                            email          VARCHAR(255) UNIQUE NOT NULL,

                            date_birth     DATE,
                            created_at     TIMESTAMP WITH TIME ZONE DEFAULT now(),
                            updated_at     TIMESTAMP WITH TIME ZONE DEFAULT now(),
                            password VARCHAR(255) NOT NULL
);

CREATE TABLE "role" (
                        role_id   SMALLSERIAL PRIMARY KEY,
                        name      VARCHAR(50) UNIQUE NOT NULL

);
INSERT INTO role (name) VALUES
                            ('admin'),
                            ('organizator'),
                            ('soutezici'),
                            ('user'),
                            ('rozhodci')
ON CONFLICT DO NOTHING;

-- many-to-many uživatel <-> role
CREATE TABLE "role_user" (
                             id        BIGSERIAL PRIMARY KEY,
                             role_id   SMALLINT NOT NULL REFERENCES role(role_id) ON DELETE CASCADE,
                             user_id   BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                             UNIQUE (role_id, user_id)
);

-- ===== soutěže, události a disciplíny =====
CREATE TABLE competition (
                             competition_id BIGSERIAL PRIMARY KEY,
                             owner_id       BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE SET NULL,
                             name           VARCHAR(200) NOT NULL,
                             description    TEXT,
                             start_date     DATE NOT NULL,
                             end_date       DATE NOT NULL,

                             reg_start      DATE NOT NULL,
                             reg_end        DATE NOT NULL,
                             created_at     TIMESTAMP WITH TIME ZONE DEFAULT now(),
                             location VARCHAR(255)
);

CREATE TABLE age_category (
                              age_category_id BIGSERIAL PRIMARY KEY,
                              code            VARCHAR(20) NOT NULL UNIQUE,  -- např. "U12_15" nebo "U16_PLUS"
                              name            VARCHAR(50) NOT NULL,         -- např. "12–15", "16+"
                              min_age         INT NOT NULL,
                              max_age         INT                            -- NULL = neomezeno (např. 16+)
);

-- tabulka disciplín (doplňující metadata)
CREATE TABLE discipline (
                            discipline_id  BIGSERIAL PRIMARY KEY,
                            pocet_athletes  INT,
                            name   VARCHAR(200) NOT NULL,
                            is_team        BOOLEAN DEFAULT FALSE,
                            type VARCHAR(20),
                            created_at     TIMESTAMP WITH TIME ZONE DEFAULT now()


);

CREATE TABLE discipline_age_category (
                                 discipline_id     BIGINT REFERENCES discipline(discipline_id) ON DELETE CASCADE,
                                 age_category_id   BIGINT REFERENCES age_category(age_category_id) ON DELETE CASCADE,
                                 PRIMARY KEY (discipline_id, age_category_id)
);

-- mapování event -> discipline (pokud chcete oddělit)
CREATE TABLE competition_discipline (
                                  id           BIGSERIAL PRIMARY KEY,
                                  competition_id     BIGINT NOT NULL REFERENCES competition(competition_id) ON DELETE CASCADE,
                                  discipline_id BIGINT NOT NULL REFERENCES discipline(discipline_id) ON DELETE CASCADE,
                                  UNIQUE (competition_id, discipline_id)
);

-- ===== přihlášky =====
CREATE TABLE registration (
                              registration_id BIGSERIAL PRIMARY KEY,
                              competition_id  BIGINT NOT NULL REFERENCES competition(competition_id) ON DELETE CASCADE,
                              user_id         BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE, -- kdo přihlášku vytvořil (zástupce týmu)
                              status          registration_status NOT NULL DEFAULT 'saved',
                              contact_name    VARCHAR(200),
                              contact_email   VARCHAR(255),
                              created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
                              updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- rozhodčí připojení k přihlášce (může být více)
CREATE TABLE referee (
                         referee_id   BIGSERIAL PRIMARY KEY,
                         first_name   VARCHAR(100) NOT NULL,
                         last_name    VARCHAR(100) NOT NULL,
                         category     VARCHAR(100)
);

CREATE TABLE registration_referee (
                                      registration_referee_id BIGSERIAL PRIMARY KEY,
                                      registration_id         BIGINT NOT NULL REFERENCES registration(registration_id) ON DELETE CASCADE,
                                      referee_id              BIGINT NOT NULL REFERENCES referee(referee_id) ON DELETE CASCADE,
                                      UNIQUE (registration_id, referee_id)
);

-- ===== týmy, závodníci a přiřazení =====
CREATE TABLE "team" (
                        team_id        BIGSERIAL PRIMARY KEY,
                        registration_id BIGINT NOT NULL REFERENCES registration(registration_id) ON DELETE CASCADE,
                        name           VARCHAR(200) NOT NULL,
                        created_at     TIMESTAMP WITH TIME ZONE DEFAULT now(),
                        UNIQUE (registration_id, name)
);

CREATE TABLE athlete (
                         athlete_id   BIGSERIAL PRIMARY KEY,
                         first_name   VARCHAR(100) NOT NULL,
                         last_name    VARCHAR(100) NOT NULL,
                         birth_year   INT,
                         gender       CHAR(1), -- 'M'/'F'/'X' apod.
                         created_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- spojovací tabulka: which athlete is in which team
CREATE TABLE team_athlete (
                              team_athlete_id BIGSERIAL PRIMARY KEY,
                              athlete_id      BIGINT NOT NULL REFERENCES athlete(athlete_id) ON DELETE CASCADE,
                              team_id         BIGINT NOT NULL REFERENCES team(team_id) ON DELETE CASCADE,
                              UNIQUE (athlete_id, team_id)
);

-- ===== přiřazení závodníka / týmu do konkrétní disciplíny / eventu (Entry) =====
-- tato tabulka dovoluje označit "X" pro individuální, nebo číslo týmu pro týmové disciplíny
CREATE TABLE entry (
                       entry_id      BIGSERIAL PRIMARY KEY,
                       registration_id BIGINT NOT NULL REFERENCES registration(registration_id) ON DELETE CASCADE,
                       athlete_id    BIGINT NOT NULL REFERENCES athlete(athlete_id) ON DELETE CASCADE,
                       discipline_id      BIGINT NOT NULL REFERENCES discipline(discipline_id) ON DELETE CASCADE,
                       team_id       BIGINT NULL REFERENCES team(team_id) ON DELETE CASCADE,
                       team_group    INT NULL, -- pro týmové disciplíny: stejné číslo znamená členy jednoho týmu v disciplíně (podle excelu)
                       is_selected   BOOLEAN NOT NULL DEFAULT TRUE, -- jestli je vybrán/škrtnut (X)
                       notes         TEXT,
                       created_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
                       UNIQUE (athlete_id, discipline_id) -- jedinečná účast jedince v jedné události
);

-- Pokud je event.team_event = FALSE, pak team_group a team_id by měly být NULL.
-- Můžeme přidat constraint pomocí triggeru nebo check přes poddotaz (Postgres check s poddotazem není povolen),
-- proto doporučujeme ověřit v aplikační vrstvě nebo vytvořit TRIGGER (není součástí tohoto DDL).

-- ===== doplňující indexy pro výkon vyhledávání =====
CREATE INDEX idx_user_email ON user_account (email);
CREATE INDEX idx_competition_owner ON competition (owner_id);
CREATE INDEX idx_event_comp ON competition_discipline (competition_id);
CREATE INDEX idx_team_reg ON team (registration_id);
CREATE INDEX idx_entry_event ON entry (discipline_id);
CREATE INDEX idx_entry_athlete ON entry (athlete_id);


