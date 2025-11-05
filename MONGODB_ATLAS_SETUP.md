# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" or "Sign In"
3. Create an account or log in

## Step 2: Create a Cluster

1. After logging in, click "Build a Database"
2. Choose **FREE** tier (M0 Sandbox)
3. Select a cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region closest to you
5. Click "Create Cluster" (takes 3-5 minutes)

## Step 3: Create Database User

1. Click "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username (e.g., `admin`)
5. Enter a strong password (save it!)
6. Set privileges to "Read and write to any database"
7. Click "Add User"

## Step 4: Whitelist IP Address

1. Click "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose one:
   - **For development**: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - **For production**: Add your specific IP address
4. Click "Confirm"

## Step 5: Get Connection String

1. Go back to "Database" (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as driver
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Update .env File

1. Open the `.env` file in your project root
2. Replace the `MONGODB_URI` with your connection string
3. Replace `<username>` with your database username
4. Replace `<password>` with your database password
5. Add `/attendance_app` before the `?` to specify database name

**Example:**
```
MONGODB_URI=mongodb+srv://admin:MyPassword123@cluster0.abc123.mongodb.net/attendance_app?retryWrites=true&w=majority
```

## Step 7: Test Connection

1. Make sure your `.env` file is saved
2. Restart your server:
   ```bash
   cd server
   npm start
   ```
3. Look for "✅ Connected to MongoDB Atlas" in the console

## Step 8: Migrate Existing Data (Optional)

If you have data in your local MongoDB, you can export and import it:

### Export from local MongoDB:
```bash
mongodump --db attendance_app --out ./backup
```

### Import to Atlas:
```bash
mongorestore --uri "your-atlas-connection-string" --db attendance_app ./backup/attendance_app
```

## Troubleshooting

### Connection Timeout
- Check if your IP is whitelisted in Network Access
- Verify your username and password are correct
- Make sure there are no special characters in password (or URL encode them)

### Authentication Failed
- Double-check username and password
- Make sure user has proper permissions

### Database Not Found
- The database will be created automatically when you insert first document
- Make sure you added `/attendance_app` in the connection string

## Security Tips

1. **Never commit .env file to Git** - It's already in .gitignore
2. Use strong passwords for database users
3. For production, whitelist only specific IP addresses
4. Rotate passwords regularly
5. Use different credentials for development and production

## Benefits of MongoDB Atlas

✅ **Automatic Backups** - Daily backups included in free tier
✅ **High Availability** - Built-in redundancy
✅ **Scalability** - Easy to upgrade as you grow
✅ **Security** - Encrypted connections by default
✅ **Monitoring** - Built-in performance monitoring
✅ **Global** - Access from anywhere with internet

## Next Steps

Once connected to Atlas:
- Your app will work from anywhere with internet
- No need to run local MongoDB
- Data is automatically backed up
- Can access from mobile app, admin panel, etc.
