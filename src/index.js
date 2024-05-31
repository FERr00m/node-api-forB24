import * as url from 'url';
import process from 'process';
import chalk from 'chalk';
import 'dotenv/config';
import bodyParser from 'body-parser';
//const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
import fs from 'fs';
import morgan from 'morgan';
import cors from 'cors';

import path from 'path';

import express from 'express';

import handlers from '#@/lib/handlers.js';
import cookieParser from 'cookie-parser';
import session from 'express-session';

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  methods: ['GET'],
};

import { createCA, createCert } from 'mkcert';
import https from 'https';

const certDir = path.resolve(__dirname, 'cert');
let httpsOptions;

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir);

  const ca = await createCA({
    organization: 'Hello CA',
    countryCode: 'NP',
    state: 'Bagmati',
    locality: 'Kathmandu',
    validity: 365,
  });

  const cert = await createCert({
    ca: { key: ca.key, cert: ca.cert },
    domains: ['127.0.0.1', 'localhost'],
    validity: 365,
  });

  httpsOptions = {
    key: cert.key, // путь к ключу
    cert: cert.cert, // путь к сертификату
  };
  console.log('certDir', certDir);
  fs.writeFileSync(certDir + '/cert.key', httpsOptions.key);
  fs.writeFileSync(certDir + '/cert.crt', httpsOptions.cert);
} else {
  httpsOptions = {
    key: fs.readFileSync(certDir + '/cert.key'), // путь к ключу
    cert: fs.readFileSync(certDir + '/cert.crt'), // путь к сертификату
  };
}

// Явным образом активировать кэширование представлений
//app.set('view cache', true)

switch (process.env.NODE_ENV) {
  case 'development':
    app.use(morgan('dev'));
    break;
  case 'production':
    let dir = path.resolve(__dirname, 'var');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    const stream = fs.createWriteStream(path.resolve(dir, 'access.log'), {
      flags: 'a',
    });
    app.use(morgan('combined', { stream }));
    break;
}

// Настройка публичной папки
app.use(express.static(path.resolve(__dirname, './public')));
// Настройка парсера body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Настройка куки
app.use(cookieParser(process.env.COOKIE_SECRET || 'express'));
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET || 'express',
  })
);

app.disable('x-powered-by');
// Доверяем прокси серваку
app.enable('trust proxy');

// Маршруты get
app.get('/', cors(corsOptions), handlers.home);

// Маршруты post
app.post('/', cors(corsOptions), handlers.api.b24);

// Пользовательская страница 404
app.use(handlers.notFound);
// Пользовательская страница 500
app.use(handlers.serverError);

function startServer(port) {
  https.createServer(httpsOptions, app).listen(443, () => {
    console.log(
      chalk.bgBlue(
        `Express запущен в режиме ` +
          `${app.get('env')} на http://localhost:${port}` +
          '; нажмите Ctrl+C для завершения.'
      )
    );
  });
  // app.listen(port, () => {
  //   console.log(
  //     chalk.bgBlue(
  //       `Express запущен в режиме ` +
  //         `${app.get('env')} на http://localhost:${port}` +
  //         '; нажмите Ctrl+C для завершения.'
  //     )
  //   );
  // });
}

// преобразовать наше приложение так, чтобы оно импортировалось как модуль
if (process.argv[1] === url.fileURLToPath(import.meta.url)) {
  startServer(port);
}
export default startServer;
