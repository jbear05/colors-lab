-- Test database for the API integration tests (loaded by the CI workflow).
-- Columns are the ones the LAMPAPI endpoints query; the production schema is not in this repo.
CREATE TABLE Users (
  ID INT NOT NULL AUTO_INCREMENT,
  firstName VARCHAR(50) NOT NULL DEFAULT '',
  lastName VARCHAR(50) NOT NULL DEFAULT '',
  Login VARCHAR(50) NOT NULL DEFAULT '',
  Password VARCHAR(50) NOT NULL DEFAULT '',
  PRIMARY KEY (ID)
);

CREATE TABLE Colors (
  ID INT NOT NULL AUTO_INCREMENT,
  Name VARCHAR(50) NOT NULL DEFAULT '',
  UserID INT NOT NULL DEFAULT 0,
  PRIMARY KEY (ID)
);

INSERT INTO Users (firstName, lastName, Login, Password) VALUES
  ('Test', 'User', 'testuser', 'testpass'),
  ('Other', 'User', 'otheruser', 'otherpass');
