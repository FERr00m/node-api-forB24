import * as fs from 'node:fs/promises';
import CRest from '#@lib/bitrixCrest.js';

const home = async (req, res) => {
  req.session.userName = 'Anonymous';
  const CRestClient = new CRest(
    req,
    'local.664de05b68bf64.57416231',
    'FDvJftqFlUHu44iUhu4e6JLd0ynkxO5xpXckuEmBZBNGtnBzxS'
  );

  let r = CRestClient.call('pull.application.event.add', {
    COMMAND: 'HI',
    PARAMS: { ass: 1 },
    MODULE_ID: 'application',
  });
  console.log(r);

  return res.send(JSON.stringify({ hello: 'world' }));
};

const notFound = (req, res) => res.status(404).json({ error: '404' });
const serverError = (err, req, res, next) =>
  res.status(500).json({ error: '500' });
const headers = (req, res) => {
  res.type('text/plain');
  const headers = Object.entries(req.headers).map(
    ([key, value]) => `${key}: ${value}`
  );
  res.send(headers.join('\n'));
};

const api = {
  b24: (req, res) => {
    console.log(req);
    res.send({ result: 'ok', b24: 'HI' });
  },
};

export default {
  home,
  notFound,
  serverError,
  headers,
  api,
};
