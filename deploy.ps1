git add .

git commit -m "EVSavari update"

git push origin main

node --use-system-ca "$env:APPDATA\npm\node_modules\vercel\dist\index.js" --prod