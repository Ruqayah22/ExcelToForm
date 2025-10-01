# Excel To Form Project:

> this project is a button to convert excel sheet to custom form.

## Package: 

- `npx create-react-app appName` 
- `npm install @mui/material @emotion/react @emotion/styled` 
> -> Mui  
- `npm i jspdf` 
> -> A library to generate PDFs in JavaScript.
- `npm i jspdf-autotable` 
> -> This jsPDF plugin adds the ability to generate PDF tables either by parsing HTML tables or by using Javascript data directly. 
- `npm i react-to-print` 
> -> Print React components in the browser
- `npm i xlsx`
> -> The SheetJS Community Edition offers battle-tested open-source solutions for extracting useful data from almost any complex spreadsheet and generating new spreadsheets that will work with legacy and modern software alike.

### Deployment: 

github pages

*******
### The Steps to Deployed it To Github pages:

1. install the package: 
``` 
npm install gh-pages --save-dev 
or 
npm install gh-pages --save-dev --legacy-peer-deps
or 
npm install gh-pages --save-dev --force

```
2. Add homepage in package.json
` "homepage": "https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME" `

3. Add Deployment Scripts 
> (Inside package.json, find "scripts" and add these two scripts:)

```
"predeploy": "npm run build",
"deploy": "gh-pages -d build" 
```
be like:
```
"scripts": {
  "start": "react-scripts start",
  "build": "react-scripts build",
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}

```
4. Push Your Code to GitHub 
- if you don't have a GitHub repository do this:
```
git init
git add .
git commit -m "Initial commit"
git branch -M master
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
git push -u origin master

```
if already have do this:
```
git add .
git commit -m "Your Commit"
git push origin master
```
5. Deploy to GitHub Pages
Run this command to deploy:
`npm run deploy`

> After it finishes, your app will be live at:
> https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME

6. Enable GitHub Pages in Repo Settings
1. Go to your GitHub repository.
2. Click on Settings → Pages.
3. Under Source, select GitHub Actions or gh-pages branch.
4. Click Save.

> the repository of you project you deploy it now. 
7. (Optional) Fix Routing for React Router
If your project uses React Router, update BrowserRouter in index.js:
```
import { BrowserRouter } from "react-router-dom";

<BrowserRouter basename="/YOUR_REPO_NAME">
  <App />
</BrowserRouter>

```

### Done  The app is now live on GitHub Pages. 

### If the changes don’t show, clear your cache using:
> inside the page in browser

```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```
> If Still Not Working: Force Redeploy
>Try deleting the gh-pages branch and re-deploying:

```
git push origin --delete gh-pages
npm run deploy 
```