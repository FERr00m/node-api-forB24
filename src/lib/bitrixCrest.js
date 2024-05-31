import axios from 'axios';
import fs from 'fs';
import * as url from 'url';
import chalk from 'chalk';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
export default class CRest {
  constructor(req, C_REST_CLIENT_ID = '', C_REST_CLIENT_SECRET = '') {
    this.VERSION = '1.36';
    this.BATCH_COUNT = 50; //count batch 1 query
    this.TYPE_TRANSPORT = 'json'; // json or xml
    this.REQUEST = req; // json or xml
    this.C_REST_CLIENT_ID = C_REST_CLIENT_ID; // json or xml
    this.C_REST_CLIENT_SECRET = C_REST_CLIENT_SECRET; // json or xml
    this.C_REST_LOGS_DIR = ''; // json or xml
  }

  randomInteger(min, max) {
    // случайное число от min до (max+1)
    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
  }

  htmlEscape(text) {
    return text.replace(/[<>'"&]/g, function (match, pos, originalText) {
      switch (match) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
        case '"':
          return '&quot;';
        case "'":
          return '&quot;';
      }
    });
  }

  installApp() {
    let result = {
      rest_only: true,
      install: false,
    };
    if (this.REQUEST['event'] == 'ONAPPINSTALL' && this.REQUEST['auth']) {
      result['install'] = this._setAppSettings(this.REQUEST['auth'], true);
    } else if (this.REQUEST['PLACEMENT'] == 'DEFAULT') {
      result['rest_only'] = false;
      result['install'] = this._setAppSettings(
        {
          access_token: this.htmlEscape(this.REQUEST['AUTH_ID']),
          expires_in: this.htmlEscape(this.REQUEST['AUTH_EXPIRES']),
          application_token: this.htmlEscape(this.REQUEST['APP_SID']),
          refresh_token: this.htmlEscape(this.REQUEST['REFRESH_ID']),
          domain: this.htmlEscape(this.REQUEST['DOMAIN']),
          client_endpoint:
            'https://' + this.htmlEscape(this.REQUEST['DOMAIN']) + '/rest/',
        },
        true
      );
    }

    this.setLog(
      {
        request: this.REQUEST,
        result: result,
      },
      'installApp'
    );
    return result;
  }

  async callCurl(arParams) {
    let arSettings = this._getAppSettings();
    console.log(chalk.red('arSettings'), arSettings);
    let url;
    if (arSettings !== false) {
      if (arParams['this_auth'] && arParams['this_auth'] == 'Y') {
        url = 'https://oauth.bitrix.info/oauth/token/';
      } else {
        url =
          arSettings['client_endpoint'] +
          arParams['method'] +
          '.' +
          this.TYPE_TRANSPORT;
        if (arSettings['is_web_hook'] || arSettings['is_web_hook'] != 'Y') {
          arParams['params']['auth'] = arSettings['access_token'];
        }
      }

      try {
        let { data } = await axios.post(url, arParams['params'], {
          headers: {
            'User-agent': 'Bitrix24 CRest PHP ' + this.VERSION,
          },
        });

        console.log('data', data);

        // $obCurl = curl_init();
        // curl_setopt($obCurl, CURLOPT_URL, $url);
        // curl_setopt($obCurl, CURLOPT_RETURNTRANSFER, true);
        // curl_setopt($obCurl, CURLOPT_POSTREDIR, 10);
        // curl_setopt($obCurl, CURLOPT_USERAGENT, 'Bitrix24 CRest PHP ' . static::VERSION);
        // if($sPostFields)
        // {
        // 	curl_setopt($obCurl, CURLOPT_POST, true);
        // 	curl_setopt($obCurl, CURLOPT_POSTFIELDS, $sPostFields);
        // }
        // curl_setopt(
        // 	$obCurl, CURLOPT_FOLLOWLOCATION, (isset($arParams[ 'followlocation' ]))
        // 	? $arParams[ 'followlocation' ] : 1
        // );
        // if(defined("C_REST_IGNORE_SSL") && C_REST_IGNORE_SSL === true)
        // {
        // 	curl_setopt($obCurl, CURLOPT_SSL_VERIFYPEER, false);
        // 	curl_setopt($obCurl, CURLOPT_SSL_VERIFYHOST, false);
        // }
        // $out = curl_exec($obCurl);
        // $info = curl_getinfo($obCurl);
        // if(curl_errno($obCurl))
        // {
        // 	$info[ 'curl_error' ] = curl_error($obCurl);
        // }
        // if(static::TYPE_TRANSPORT == 'xml' && (!isset($arParams[ 'this_auth' ]) || $arParams[ 'this_auth' ] != 'Y'))//auth only json support
        // {
        // 	$result = $out;
        // }
        // else
        // {
        // 	$result = static::expandData($out);
        // }
        // curl_close($obCurl);

        let arErrorInform;
        if (data['error']) {
          if (data['error'] == 'expired_token' && !arParams['this_auth']) {
            result = this.GetNewAuth(arParams);
          } else {
            arErrorInform = {
              expired_token:
                'expired token, cant get new auth? Check access oauth server.',
              invalid_token: 'invalid token, need reinstall application',
              invalid_grant:
                'invalid grant, check out define C_REST_CLIENT_SECRET or C_REST_CLIENT_ID',
              invalid_client:
                'invalid client, check out define C_REST_CLIENT_SECRET or C_REST_CLIENT_ID',
              QUERY_LIMIT_EXCEEDED:
                'Too many requests, maximum 2 query by second',
              ERROR_METHOD_NOT_FOUND:
                "Method not found! You can see the permissions of the application: CRest::call('scope')",
              NO_AUTH_FOUND:
                'Some setup error b24, check in table "b_module_to_module" event "OnRestCheckAuth"',
              INTERNAL_SERVER_ERROR: 'Server down, try later',
            };
            if (arErrorInform[result['error']]) {
              result['error_information'] = arErrorInform[result['error']];
            }
          }
        }
        // if(!empty($info[ 'curl_error' ]))
        // {
        // 	$result[ 'error' ] = 'curl_error';
        // 	$result[ 'error_information' ] = $info[ 'curl_error' ];
        // }

        this.setLog(
          {
            url: url,
            //info: info,
            params: arParams,
            result: result,
          },
          'callCurl'
        );

        return result;
      } catch (e) {
        this.setLog(e, 'exceptionCurl');

        return {
          error: 'exception',
          error_data: e,
        };
      }
    } else {
      this.setLog(
        {
          params: arParams,
        },
        'emptySetting'
      );
    }

    return {
      error: 'no_install_app',
      error_information: 'error install app, pls install local application ',
    };
  }

  call(method, params = {}) {
    let arPost = {
      method: method,
      params: params,
    };

    let result = this.callCurl(arPost);
    return result;
  }

  _GetNewAuth(arParams) {
    let result = {};
    let arSettings = this._getAppSettings();
    if (arSettings !== false) {
      let arParamsAuth = {
        this_auth: 'Y',
        params: {
          client_id: arSettings['C_REST_CLIENT_ID'],
          grant_type: 'refresh_token',
          client_secret: arSettings['C_REST_CLIENT_SECRET'],
          refresh_token: arSettings['refresh_token'],
        },
      };
      let newData = this.callCurl(arParamsAuth);

      if (this._setAppSettings(newData)) {
        arParams['this_auth'] = 'N';
        result = this.callCurl(arParams);
      }
    }
    return result;
  }

  _setAppSettings(arSettings, isInstall = false) {
    let result = false;
    if (typeof arSettings !== 'undefined') {
      let oldData = this._getAppSettings();
      if (isInstall != true && !oldData && typeof oldData !== 'undefined') {
        arSettings = Object.assign({}, oldData, arSettings);
      }
      result = this._setSettingData(arSettings);
    }
    return result;
  }

  _getAppSettings() {
    let arData = this._getSettingData();
    console.log(chalk.red('arData'), arData);
    let isCurrData = false;
    if (
      arData['access_token'] &&
      arData['domain'] &&
      arData['refresh_token'] &&
      arData['application_token'] &&
      arData['client_endpoint']
    ) {
      isCurrData = true;
    }

    return isCurrData ? arData : false;
  }

  _getSettingData() {
    let result = {};
    if (fs.existsSync(__dirname + '/settings.json')) {
      result = JSON.parse(
        fs.readFileSync(__dirname + '/settings.json', 'utf8')
      );

      if (this.C_REST_CLIENT_ID && this.C_REST_CLIENT_ID !== '') {
        result['C_REST_CLIENT_ID'] = this.C_REST_CLIENT_ID;
      }
      if (this.C_REST_CLIENT_SECRET && this.C_REST_CLIENT_SECRET !== '') {
        result['C_REST_CLIENT_SECRET'] = this.C_REST_CLIENT_SECRET;
      }
    }
    return result;
  }

  _setSettingData(arSettings) {
    let dir = __dirname + '/settings.json';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    try {
      fs.writeFileSync(dir, arSettings);
      return true;
    } catch (err) {
      console.error(err);
      this.setLog(
        {
          err: err,
        },
        'setSettingData'
      );
      return false;
    }
  }

  setLog(arData, type = '') {
    let path;
    if (this.C_REST_LOGS_DIR) {
      path = this.C_REST_LOGS_DIR;
    } else {
      if (!fs.existsSync(__dirname + 'logs/')) {
        fs.mkdirSync(__dirname + 'logs/');
      }
      path = __dirname + 'logs/';
    }
    let d = new Date();
    path += d.toLocaleDateString().replaceAll(/[:\./]/g, '_') + '/';

    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }

    path +=
      new Date(Date.now()).toLocaleTimeString().replaceAll(':', '_') +
      '_' +
      type +
      '_' +
      this.randomInteger(1, 9999999) +
      'log';

    try {
      fs.writeFileSync(path + '.txt', JSON.stringify(arData));
      return true;
    } catch (err) {
      console.error(err);

      return false;
    }
  }
}
