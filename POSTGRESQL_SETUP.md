# PostgreSQL Setup Guide for Finsight Expense Tracker

## Prerequisites
PostgreSQL must be installed and running on your system.

## Installation

### Windows
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user
4. Default port is 5432

### Using Chocolatey (Windows)
```powershell
choco install postgresql
```

### macOS
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Database Setup

### 1. Access PostgreSQL
```bash
# Windows (using psql from command line)
psql -U postgres

# Or use pgAdmin if installed
```

### 2. Create Database
```sql
CREATE DATABASE finsight_db;

-- Verify the database was created
\l
```

### 3. Create User (Optional - if you want a dedicated user)
```sql
CREATE USER finsight_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE finsight_db TO finsight_user;
```

### 4. Exit psql
```sql
\q
```

## Configuration

Update the `.env` file in the `backend` directory with your PostgreSQL credentials:

```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_USER=postgres          # or your custom user
DB_PASS=postgres          # your PostgreSQL password
DB_NAME=finsight_db
DB_PORT=5432
```

## Running the Application

1. Stop the current backend server (if running)
2. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

The application will automatically:
- Connect to PostgreSQL
- Create all necessary tables
- Sync the database schema

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running:
  ```bash
  # Windows
  Get-Service postgresql*
  
  # macOS/Linux
  sudo systemctl status postgresql
  ```

### Authentication Failed
- Check your username and password in `.env`
- Verify PostgreSQL user exists and has correct permissions

### Database Does Not Exist
- Create the database using the SQL commands above
- Ensure the database name in `.env` matches the created database

### Port Already in Use
- Check if PostgreSQL is running on default port 5432
- Update `DB_PORT` in `.env` if using a different port

## Migrating Data from SQLite

If you have existing data in SQLite that you want to migrate:

1. **Export from SQLite** (manual process):
   - Use a database management tool
   - Export data as SQL or CSV

2. **Import to PostgreSQL**:
   - Use pgAdmin or psql to import the data
   - Or start fresh (the app will recreate tables automatically)

## Verifying the Migration

After starting the backend, you should see:
```
PostgreSQL Connected...
Database synced
Server running in development mode on port 5000
```

## Database Management Tools

- **pgAdmin**: Graphical interface (recommended for beginners)
  - Usually installed with PostgreSQL
  - Access at: http://localhost:5050 (or similar)

- **psql**: Command-line interface
  - Fast and powerful
  - Good for quick operations

- **DBeaver**: Universal database tool
  - Supports multiple databases
  - Great for advanced users

## Production Notes

For production deployment:
- Use strong passwords
- Enable SSL connections
- Set up regular backups
- Consider using connection pooling (already configured in the app)
- Use environment-specific credentials
- Never commit `.env` file to version control
