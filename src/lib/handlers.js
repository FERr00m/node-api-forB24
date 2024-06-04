import * as fs from 'node:fs/promises';
import CRest from '#@lib/bitrixCrest.js';

const home = async (req, res) => {
  // req.session.userName = 'Anonymous';
  // const CRestClient = new CRest(
  //   req,
  //   'local.664de05b68bf64.57416231',
  //   'FDvJftqFlUHu44iUhu4e6JLd0ynkxO5xpXckuEmBZBNGtnBzxS'
  // );
  //
  // let r = CRestClient.call('pull.application.event.add', {
  //   COMMAND: 'HI',
  //   PARAMS: { ass: 1 },
  //   MODULE_ID: 'application',
  // });
  //console.log('request', r);

  res.send(JSON.stringify({ hello: 'world' }));
};

const install = async (req, res) => {

  let body = req.body;
  let query = req.query;

  let params = Object.assign({}, body, query)

  console.log('body', body)
  console.log('query', query)
  console.log('params', params)
  const CRestClient = new CRest(
    params,
    'local.664de05b68bf64.57416231',
    'FDvJftqFlUHu44iUhu4e6JLd0ynkxO5xpXckuEmBZBNGtnBzxS'
  );

  let result = CRestClient.installApp();

  // let r = CRestClient.call('pull.application.event.add', {
  //   COMMAND: 'HI',
  //   PARAMS: { ass: 1 },
  //   MODULE_ID: 'application',
  // });
  // console.log('request', r);
  let html = '';
  if(result['rest_only'] === false) {
    html = `
      <head>
        <script src="//api.bitrix24.com/api/v1/"></script>
        ${result['install'] === true ? '<script>BX24.init(function(){BX24.installFinish();});</script>' : ''}
      </head>
      <body>
        ${result['install'] === true ? 'installation has been finished' : 'installation error'}
      </body>
    `
  }
  res.send(html);
  //res.json({ hello: 's' });
};

const event = async (req, res) => {

  let body = req.body;
  let query = req.query;
  let par = req.params;

  let params = Object.assign({}, body, query)

  console.log('body', body)
  console.log('query', query)
  console.log('par', par)
  console.log('params', params)
  const CRestClient = new CRest(
    params,
    'local.664de05b68bf64.57416231',
    'FDvJftqFlUHu44iUhu4e6JLd0ynkxO5xpXckuEmBZBNGtnBzxS'
  );

  if (par.signal == 1) {
    await CRestClient._GetNewAuth({method: 'pull.application.event.add', params: {
        COMMAND: 'HI',
        PARAMS: { ass: 1 },
        MODULE_ID: 'application',
      }})
    res.json({ hello: '222' });
  } else if (par.signal == 2){
    let r = await CRestClient.call('pull.application.event.add', {
      COMMAND: 'HI',
      PARAMS: { ass: 1 },
      MODULE_ID: 'application',
    });
    console.log('request', r);
    res.json({ hello: 's' });
  } else {
    res.json({ hello: 'end' });
  }





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
  install,
  event,
  api,
};
