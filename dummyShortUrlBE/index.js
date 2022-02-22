const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
const port = 3001;

const ApiSuffix = '/api/v1/';
const db = {
    urls: [
        {
            url: 'http://127.0.0.1:3000',
            id: 1
        }
    ],
    lastID: 1
}

app.get(`${ApiSuffix}urls/`, (req, res) => {
    res.json(db.urls);
})

function _addURL(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`;
    }
    if (db.urls.some((urlObj) => urlObj.url === url)) {
        return {isSuccess: false, message: 'The URL already exist'};
    }
    let id = ++db.lastID;
    let urlObj = {
        url: url,
        id: id
    }
    db.urls.push(urlObj);
    return {isSuccess: true, message: null};
}

function _renderRedirectPage(msg) {
    return `
    <html>
        <head>
            <meta http-equiv="refresh" content="3;url=/" />
        </head>
        <body>
            <h1>${msg}</h1>
            <h3>Redirecting in 3 seconds...</h3>
        </body>
    </html>
    `;
}

function _renderCell(url) {
    return `
        <li>
            <a href="${url.url}" rel="noreferer" target="_blank">${url.url}</a>
            <a href="/s/${url.id}/" rel="noreferer" target="_blank">Shortcut</a>
            <form action="/url/delete/${url.id}/" method="POST"><input type="submit" value="Delete"/></form>
        </li>
    `;
}

app.post(`${ApiSuffix}url/`, (req, res) => {
    let url = req.body.url;
    if (!url || url.length == 0) {
        res.status(400).json({error: 'No URL provided'});
    }
    let result = _addURL(url);
    if (result.isSuccess) {
        res.json(db.urls);
    } else {
        res.status(409).json({error: 'The URL already exist'});
    }
})


app.post('/url/', (req, res) => {
    let url = req.body.url;
    if (!url || url.length == 0) {
        res.status(400).send(_renderRedirectPage('No url provided'));
    }
    let result = _addURL(url);
    if (result.isSuccess) {
        res.redirect('/');
    } else {
        res.status(409).send(_renderRedirectPage('The URL already exist'));
    }
})

app.get('/', (req, res) => {
    let list = db.urls.map((url) => _renderCell(url)).join();

    res.send(`
    <html>
        <body>
            <form action="/url/" method="POST">
                <input type="text" name="url" placeholder="URL">
                <input type="submit" value="Submit"/>
            </form>
            <ul>${list}</li>
        </body>
    </html>
    `);
})

app.get('/s/:id/', (req, res) => {
    let target = db.urls.find((urlObj) => urlObj.id === Number(req.params.id));
    res.redirect(target.url);
})

app.post('/url/delete/:id/', (req, res) => {
    let target = null;
    db.urls = db.urls.filter((urlObj) => {
        if (urlObj.id === Number(req.params.id)) {
            target = urlObj;
            return false;
        } else {
            return true;
        }
    });
    res.send(_renderRedirectPage(`Removing ${target.url}`));
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})