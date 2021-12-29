CREATE TABLE IF NOT EXISTS cursors (
  cursor varchar(255) NOT NULL,
  PRIMARY KEY (cursor)
);

CREATE TABLE IF NOT EXISTS gameresults (
  gameid varchar(255) NOT NULL,
  t numeric NOT NULL,
  playeraname varchar(255) NOT NULL,
  playeraplayed varchar(255) NOT NULL,
  playerbname varchar(255) NOT NULL,
  playerbplayed varchar(255) NOT NULL,
  PRIMARY KEY (gameid)
);