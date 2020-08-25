const fs = require('fs');
const path = require('path');
const CERT_PATH = path.join(__dirname, './apiclient_cert.p12')

module.exports = {
  MCHID: '1520349421',//商户id
  KEY: 'K1mobnoteTech1465526902Goluk2108',
  APPID: 'wx3f05da9c3ab188c0',
  secret: 'd6b9ba1e90d590933a100dc54792993a',
  CERT_FILE_CONTENT: fs.existsSync(CERT_PATH) ? fs.readFileSync(CERT_PATH) : null,
  TIMEOUT: 10000 // 毫秒
};
