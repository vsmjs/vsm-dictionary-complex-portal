/**
 * File used to quick test the `getEntries` function of
 * `DictionaryComplexPortal.js`
 */

const DictionaryComplexPortal = require('../src/DictionaryComplexPortal');

const dict = new DictionaryComplexPortal({log: true});

dict.getEntries({
  filter: { id: [
    'https://www.ebi.ac.uk/complexportal/complex/CPX-200',
    'https://www.ebi.ac.uk/complexportal/complex/CPX-20',
    'https://www.ebi.ac.uk/complexportal/complex/CPX-2000'
  ]},
  sort: 'id',
  page: 1,
  perPage: 3
}, (err, res) => {
  if (err) console.log(JSON.stringify(err, null, 4));
  else {
    console.log(JSON.stringify(res, null, 4));
    console.log('\n#Results: ' + res.items.length);
  }
});
