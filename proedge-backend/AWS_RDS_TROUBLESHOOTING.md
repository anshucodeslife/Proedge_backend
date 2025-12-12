# 🔧 AWS RDS Connection Troubleshooting

## Current Issue
```
Can't reach database server at proedge-db.czaug4s6i5qe.ap-south-1.rds.amazonaws.com:5432
```

## Common Causes & Solutions

### 1. Security Group Configuration ⚠️ **Most Likely Issue**

Your AWS RDS security group needs to allow inbound connections from your IP address.

**Steps to Fix:**

1. **Go to AWS Console** → RDS → Databases
2. **Click on** `proedge-db`
3. **Go to** "Connectivity & security" tab
4. **Click on** the VPC security group (e.g., `sg-xxxxx`)
5. **Edit Inbound Rules:**
   - Click "Edit inbound rules"
   - Add rule:
     - **Type:** PostgreSQL
     - **Protocol:** TCP
     - **Port:** 5432
     - **Source:** My IP (or 0.0.0.0/0 for testing - NOT recommended for production)
   - Click "Save rules"

### 2. Public Accessibility

**Check if RDS is publicly accessible:**

1. AWS Console → RDS → Databases → `proedge-db`
2. Under "Connectivity & security"
3. Check "Publicly accessible" = **Yes**

**If it's "No":**
- Click "Modify"
- Scroll to "Connectivity"
- Set "Public access" to **Yes**
- Click "Continue" → "Apply immediately" → "Modify DB instance"

### 3. Network Configuration

**Verify your network allows outbound connections:**
- Check if your firewall/antivirus blocks port 5432
- Try from a different network (mobile hotspot) to test

### 4. Database Credentials

**Verify your .env has correct credentials:**

```env
DATABASE_URL="postgresql://username:password@proedge-db.czaug4s6i5qe.ap-south-1.rds.amazonaws.com:5432/proedge_db"
```

Replace:
- `username` - Your RDS master username
- `password` - Your RDS master password (URL-encode special characters)
- `proedge_db` - Your database name

### 5. Test Connection

**Test from command line (if PostgreSQL client is installed):**

```bash
psql -h proedge-db.czaug4s6i5qe.ap-south-1.rds.amazonaws.com -p 5432 -U your_username -d proedge_db
```

**Or use an online PostgreSQL client:**
- [pgAdmin](https://www.pgadmin.org/)
- [DBeaver](https://dbeaver.io/)

---

## Quick Fix Checklist

- [ ] **Security Group** - Allow your IP on port 5432
- [ ] **Public Access** - Set to Yes
- [ ] **Credentials** - Verify username/password in .env
- [ ] **Network** - Check firewall/antivirus
- [ ] **Database Status** - Ensure RDS instance is "Available"

---

## Alternative: Use Local Database for Development

If you can't access AWS RDS from your location, you can:

1. **Set up local PostgreSQL:**
   ```bash
   # Install PostgreSQL
   # Create local database
   createdb proedge_local
   
   # Update .env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/proedge_local"
   ```

2. **Run migrations:**
   ```bash
   cd "c:\Users\itsan\Desktop\Proedge New Project\Proedge_backend\proedge-backend"
   npx prisma db push
   npm run seed
   ```

---

## After Fixing

1. **Restart backend server:**
   - Stop current server (Ctrl+C)
   - Run `npm run dev` again

2. **Test connection:**
   - Visit http://localhost:3000/courses
   - Should return course data instead of database error

---

## Need Help?

**Check AWS RDS Status:**
- AWS Console → RDS → Databases
- Status should be "Available"
- Endpoint should match your DATABASE_URL

**Common Special Characters in Password:**
If your password has special characters, URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `&` → `%26`
- `/` → `%2F`

Example:
```
Password: MyP@ss#123
Encoded: MyP%40ss%23123
```
