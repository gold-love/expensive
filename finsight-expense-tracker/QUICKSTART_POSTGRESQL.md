# Quick Start: Install and Setup PostgreSQL

## Option 1: Install PostgreSQL for Windows (Recommended)

### Step 1: Install PostgreSQL
Download and install from: https://www.postgresql.org/download/windows/

**OR** use Chocolatey (if you have it installed):
```powershell
choco install postgresql
```

### Step 2: After Installation
1. Open **SQL Shell (psql)** from Start Menu
2. Press Enter to accept defaults until you're asked for password
3. Enter the password you set during installation
4. Run these commands:

```sql
CREATE DATABASE finsight_db;
\q
```

---

## Option 2: Use Docker (Easiest - No Installation)

If you have Docker Desktop installed, run this command:

```powershell
docker run --name finsight-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=finsight_db -p 5432:5432 -d postgres:15
```

This will:
- Download PostgreSQL Docker image
- Create a container named `finsight-postgres`
- Set password to `postgres`
- Create database `finsight_db`
- Expose port 5432

To stop the container later:
```powershell
docker stop finsight-postgres
```

To start it again:
```powershell
docker start finsight-postgres
```

---

## After PostgreSQL is Running

1. Update `.env` file with your credentials (already done ✅)
2. Restart the backend server
3. The application will automatically create all tables

---

## Current Configuration

Your `.env` file is already configured with:
- **Database**: finsight_db
- **User**: postgres
- **Password**: postgres
- **Host**: localhost
- **Port**: 5432

If you use different credentials during installation, update the `.env` file accordingly.
