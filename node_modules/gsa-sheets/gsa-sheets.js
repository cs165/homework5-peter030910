const googleapis = require('googleapis');
const googleAuth = require('google-auth-library');

const ALL_ROWS_RANGE = 'A:ZZ';

const SUCCESS_RESPONSE = {response: 'success'};

function createGsaSpreadsheet(email, key, sheetId) {
  const sheet = {};
  sheet.getRows = () => {
    return getRows(sheetId, email, key);
  };
  sheet.appendRow = (row) => {
    return appendRow(sheetId, email, key, row);
  };
  sheet.deleteRow = (rowIndex) => {
    return deleteRow(sheetId, email, key, rowIndex);
  };
  sheet.setRow = (rowIndex, row) => {
    return updateRow(sheetId, email, key, rowIndex, row);
  };

  return sheet;
}

function getRows(spreadsheetId, email, key) {
  return new Promise((resolve) => {
    authenticate(email, key).then((oauth2Client) => {
      const sheets = googleapis.sheets('v4');
      sheets.spreadsheets.values.get({
        auth: oauth2Client,
        spreadsheetId: spreadsheetId,
        range: ALL_ROWS_RANGE,
      }, function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          resolve( {error: err} );
          return;
        }
        let rows = [];
        if (response && response.values) {
          rows = response.values;
        };
        resolve({rows: rows});
      });
    });
  });
}

function updateRow(spreadsheetId, email, key, rowIndex, row) {
  return new Promise((resolve) => {
    if (rowIndex < 0) {
      resolve(SUCCESS_RESPONSE);
      return;
    }
    const rowNumber = rowIndex + 1;
    const range = `${rowNumber}:${rowNumber}`;
    authenticate(email, key).then((oauth2Client) => {
      const sheets = googleapis.sheets('v4');
      sheets.spreadsheets.values.update({
        valueInputOption: 'RAW',
        auth: oauth2Client,
        spreadsheetId: spreadsheetId,
        range: range,
        resource: {
          range: range,
          values: [row],
          majorDimension: 'ROWS'
        }
      }, function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          resolve({error: err});
          return;
        }
        resolve(SUCCESS_RESPONSE);
      });
    });
  });
}

function appendRow(spreadsheetId, email, key, row) {
  return new Promise((resolve) => {
    authenticate(email, key).then((oauth2Client) => {
      const sheets = googleapis.sheets('v4');
      sheets.spreadsheets.values.append({
        valueInputOption: 'RAW',
        auth: oauth2Client,
        spreadsheetId: spreadsheetId,
        range: ALL_ROWS_RANGE,
        resource: {
          range: ALL_ROWS_RANGE,
          values: [row],
          majorDimension: 'ROWS'
        }
      }, function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          resolve({error: err});
          return;
        }
        resolve(SUCCESS_RESPONSE);
      });
    });
  });
}

function deleteRow(spreadsheetId, email, key, rowIndex) {
  return new Promise((resolve) => {
    if (rowIndex < 0) {
      resolve(SUCCESS_RESPONSE);
      return;
    }
    const deleteRequest = {
      deleteDimension: {
        range: {
          dimension: "ROWS",
          startIndex: rowIndex,
          endIndex: rowIndex + 1
        }
      }
    };
    authenticate(email, key).then((oauth2Client) => {
      const sheets = googleapis.sheets('v4');
      sheets.spreadsheets.batchUpdate({
        auth: oauth2Client,
        spreadsheetId: spreadsheetId,
        resource: {
          requests: [deleteRequest]
        }
      }, function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          resolve({error: err});
          return;
        }
        resolve(SUCCESS_RESPONSE);
      });
    });
  });
}

function authenticate(email, key) {
  const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
  ];

  return new Promise((resolve, error) => {
    const auth = new googleAuth();
    const jwt = new googleapis.auth.JWT(
      email,
      null,
      key,
      SCOPES);
    jwt.authorize(function(err, result) {
      if (err) {
        console.log(err);
        error(err);
        return;
      } else {
        resolve(jwt);
      }
    });
  });
};

module.exports = createGsaSpreadsheet;
