# Prepare repository for push

Run these commands to initialize the repository and push to GitHub. Make sure you have added `.env` to `.gitignore` and removed any secrets.

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin git@github.com:<your-username>/CheckMate.git
git push -u origin main
```

Set environment variables on Vercel (or your host) from the project's settings — do not commit `.env`.
