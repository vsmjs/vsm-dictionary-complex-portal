const DictionaryComplexPortal = require('./DictionaryComplexPortal');
const chai = require('chai'); chai.should();
const expect = chai.expect;
const nock = require('nock');
const fs = require('fs');
const path = require('path');

describe('DictionaryComplexPortal.js', () => {

  const testURLBase = 'http://test';
  const dict =
    new DictionaryComplexPortal({ baseURL: testURLBase, log: true });

  const melanomaStr = 'melanoma';
  const noResultsStr = 'somethingThatDoesNotExist';

  const getIDPath = path.join(__dirname, '..', 'resources', 'id.json');
  const getMelanomaPath = path.join(__dirname, '..', 'resources', 'melanoma.json');

  const getIDStr = fs.readFileSync(getIDPath, 'utf8');
  const getMatchesForMelanomaStr = fs.readFileSync(getMelanomaPath, 'utf8');

  before(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  after(() => {
    nock.enableNetConnect();
  });

  describe('getDictInfos', () => {
    it('returns empty result when the list of dictIDs does not '
      + ' include the domain\'s dictID', cb => {
      dict.getDictInfos({ filter: { id: [
        ' ',
        'https://www.uniprot.org',
        'https://www.ensembl.org' ]}},
      (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({ items: [] });

        cb();
      });
    });

    it('returns proper dictInfo object when `options.filter` is not properly ' +
      'defined or the domain\'s dictID is in the list of specified dictIDs', cb => {
      let expectedResult = { items: [
        {
          id: 'https://www.ebi.ac.uk/complexportal',
          abbrev: 'Complex Portal',
          name: 'Complex Portal'
        }
      ]};

      dict.getDictInfos({}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal(expectedResult);
      });

      dict.getDictInfos({ filter: { id: [
        ' ',
        'https://www.ebi.ac.uk/complexportal',
        'https://www.ensembl.org' ]}},
      (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal(expectedResult);
      });

      cb();
    });
  });

  describe('getEntries', () => {
    it('returns empty result when the `options.filter.dictID` is properly ' +
      'defined and in the list of dictIDs the domain\'s dictID is not included', cb => {
      dict.getEntries({filter: { dictID: ['']}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({ items: [] });
      });

      dict.getEntries({filter: { dictID: [
        ' ',
        'https://www.uniprot.org',
        'https://www.ensembl.org'
      ]}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({ items: [] });
      });

      cb();
    });
  });

  describe('getEntryMatchesForString', () => {
    it('returns empty result when the `options.filter.dictID` is properly ' +
      'defined and in the list of dictIDs the domain\'s dictID is not included', cb => {
      dict.getEntryMatchesForString(melanomaStr, {filter: { dictID: ['']}},
        (err, res) => {
          expect(err).to.equal(null);
          res.should.deep.equal({ items: [] });
        });

      dict.getEntryMatchesForString(melanomaStr, {filter: { dictID: [
        ' ',
        'https://www.uniprot.org',
        'https://www.ensembl.org']}},
      (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({ items: [] });
      });

      cb();
    });
  });

  describe('mapComplexPortalResToEntryObj', () => {
    it('properly maps EBI Search returned JSON object to a VSM entry '
      + 'object', cb => {
      dict.mapComplexPortalResToEntryObj(JSON.parse(getIDStr)).should.deep.equal(
        [
          {
            id: 'https://www.ebi.ac.uk/complexportal/complex/CPX-2000',
            dictID: 'https://www.ebi.ac.uk/complexportal',
            descr: 'Catalyzes the phosphorylation of fructose 6-phosphate to fructose 1,6-bisphosphate in the presence of MgATP, the first irreversible step for glycolysis. Present in the erythrocyte.',
            terms: [
              {
                str: '6-phosphofructokinase, ML3 heterotetramer'
              },
              {
                str: '3xPFKL:PFKM'
              },
              {
                str: 'PFK-ML3'
              },
              {
                str: '6-phosphofructokinase'
              },
              {
                str: 'phosphofructokinase'
              },
              {
                str: 'phosphohexokinase'
              },
              {
                str: '6PF-1-K'
              },
              {
                str: 'Pfk-1'
              },
              {
                str: 'PFK'
              }
            ],
            z: {
              species: 'human; 9606'
            }
          }
        ]
      );

      cb();
    });
  });

  describe('mapComplexPortalResToMatchObj', () => {
    it('properly maps EBI Search returned JSON object to a VSM match '
      + 'object', cb => {
      dict.mapComplexPortalResToMatchObj(JSON.parse(getMatchesForMelanomaStr), 'melanoma')
        .should.deep.equal(
          [
            {
              id: 'https://www.ebi.ac.uk/complexportal/complex/CPX-1364',
              dictID: 'https://www.ebi.ac.uk/complexportal',
              str: 'SMC5-SMC6 SUMO ligase complex',
              descr: 'SUMO ligase complex with a role in homologous recombination (HR) and replication. Required for chromosome segregation at repetitive sequences.  Localizes to repetitive elements such as the rDNA and telomeres  where is is thought to promote and resolve HR-dependent intermediates. Also required for telomere maintenance during replication and telomere elongation and for  SUMOylating components of the replisome, such as MCM2 (P29469) and the POL2 (P21951) subunit of the DNA polymerase epsilon complex (CPX-2110), which is important for replication fork progression in the presence of DNA-damaging agents.',
              type: 'T',
              terms: [
                {
                  str: 'SMC5-SMC6 SUMO ligase complex'
                },
                {
                  str: 'KRE29:MMS21:NSE1:NSE3:NSE4:NSE5:SMC5:SMC6'
                },
                {
                  str: 'Resolvin complex'
                }
              ],
              z: {
                species: 'yeast; 559292'
              }
            }
          ]
        );

      cb();
    });
  });

  describe('prepareEntrySearchURL', () => {
    it('returns proper URL(s)', cb => {
      const url1 = dict.prepareEntrySearchURL({});
      const url2 = dict.prepareEntrySearchURL({ page: 1, perPage: 2 });
      const url3 = dict.prepareEntrySearchURL({ filter: { id: ['']}, page: 1, perPage: 2 });
      const url4 = dict.prepareEntrySearchURL({ sort: 'id', page: 2, perPage: 500 });
      const url5 = dict.prepareEntrySearchURL({ sort: 'dictID', page: 101, perPage: 101 });
      const url6 = dict.prepareEntrySearchURL({ sort: 'dictID', page: 101, perPage: 100 });
      const url7 = dict.prepareEntrySearchURL({ sort: 'dictID', page: 10001, perPage: 100 });
      const url8 = dict.prepareEntrySearchURL({ filter: { id: ['https://www.ebi.ac.uk/complexportal/complex/CPX-200']},
        page: 3, perPage: 20 });
      const url9 = dict.prepareEntrySearchURL({ filter: {
        id: [
          '', 'https://www.ebi.ac.uk/complexportal/complex/CPX-200', '  ',
          'https://www.ebi.ac.uk/complexportal/complex/CPX-22',
          'https://www.ebi.ac.uk/complexportal/complex/CPX-2000' ]
      }, page: -1, perPage: 101 });

      const getAllIDsURLPart = 'domain_source:complex-portal';
      const formatURLPart = '&format=json';
      const sortURLPart = '&sort=id';
      const URLfields = 'fields=id%2Cname%2Cdescription%2Ccomplex_systematic_name%2Ccomplex_synonym%2Corganism';
      const expectedURL1 = testURLBase + '?query=' + getAllIDsURLPart
        + '&' + URLfields + sortURLPart + '&size=50&start=0' + formatURLPart;
      const expectedURL2 = testURLBase + '?query=' + getAllIDsURLPart
        + '&' + URLfields + sortURLPart + '&size=2&start=0' + formatURLPart;
      const expectedURL3 = testURLBase + '?query=' + getAllIDsURLPart
        + '&' + URLfields + sortURLPart + '&size=2&start=0' + formatURLPart;
      const expectedURL4 = testURLBase + '?query=' + getAllIDsURLPart
        + '&' + URLfields + sortURLPart + '&size=50&start=50' + formatURLPart;
      const expectedURL5 = testURLBase + '?query=' + getAllIDsURLPart
        + '&' + URLfields + sortURLPart + '&size=50&start=5000' + formatURLPart;
      const expectedURL6 = testURLBase + '?query=' + getAllIDsURLPart
        + '&' + URLfields + sortURLPart + '&size=100&start=10000' + formatURLPart;
      const expectedURL7 = testURLBase + '?query=' + getAllIDsURLPart
        + '&' + URLfields + sortURLPart + '&size=100&start=999999' + formatURLPart;
      const expectedURL8 = testURLBase + '/entry/CPX-200'
        + '?' + URLfields + formatURLPart;
      const expectedURL9 = testURLBase + '/entry/CPX-200,CPX-22,CPX-2000'
        + '?' + URLfields + formatURLPart;

      url1.should.equal(expectedURL1);
      url2.should.equal(expectedURL2);
      url3.should.equal(expectedURL3);
      url4.should.equal(expectedURL4);
      url5.should.equal(expectedURL5);
      url6.should.equal(expectedURL6);
      url7.should.equal(expectedURL7);
      url8.should.equal(expectedURL8);
      url9.should.equal(expectedURL9);

      cb();
    });
  });

  describe('prepareMatchStringSearchURL', () => {
    it('returns proper URL', cb => {
      const url1 = dict.prepareMatchStringSearchURL(melanomaStr, {});
      const expectedURL = testURLBase + '?query=melanoma&fields=id%2Cname%2Cdescription%2Ccomplex_systematic_name%2Ccomplex_synonym%2Corganism';
      const paginationURLPart1 = '&size=50&start=0';
      const formatURLPart = '&format=json';

      url1.should.equal(expectedURL + paginationURLPart1 + formatURLPart);

      const url2 = dict.prepareMatchStringSearchURL(melanomaStr, { page: 'String' });
      url2.should.equal(expectedURL + paginationURLPart1 + formatURLPart);

      const url3 = dict.prepareMatchStringSearchURL(melanomaStr, { page: 0 });
      url3.should.equal(expectedURL + paginationURLPart1 + formatURLPart);

      const url4 = dict.prepareMatchStringSearchURL(melanomaStr, { page: 4 });
      const paginationURLPart2 = '&size=50&start=150';
      url4.should.equal(expectedURL + paginationURLPart2 + formatURLPart);

      const url5 = dict.prepareMatchStringSearchURL(melanomaStr, { perPage: ['Str'] });
      url5.should.equal(expectedURL + paginationURLPart1 + formatURLPart);

      const url6 = dict.prepareMatchStringSearchURL(melanomaStr, { perPage: 0 });
      url6.should.equal(expectedURL + paginationURLPart1 + formatURLPart);

      const url7 = dict.prepareMatchStringSearchURL(melanomaStr,
        { page: 3, perPage: 100 });
      const paginationURLPart3 = '&size=100&start=200';
      url7.should.equal(expectedURL + paginationURLPart3 + formatURLPart);

      const url8 = dict.prepareMatchStringSearchURL(melanomaStr,
        { page: 1, perPage: 2 });
      const paginationURLPart4 = '&size=2&start=0';
      url8.should.equal(expectedURL + paginationURLPart4 + formatURLPart);

      cb();
    });
  });

  describe('sortEntries', () => {
    it('sorts VSM entry objects as specified in the documentation', cb => {
      const arr = [
        { id: 'e', dictID: 'rnacentral', terms: [{ str: 'a'}] },
        { id: 'd', dictID: 'rnacentral', terms: [{ str: 'b'}] },
        { id: 'c', dictID: 'rnacentral', terms: [{ str: 'c'}] },
        { id: 'b', dictID: 'rnacentral', terms: [{ str: 'b'}] },
        { id: 'a', dictID: 'rnacentral', terms: [{ str: 'c'}] }
      ];
      const arrIdSorted = [
        { id: 'a', dictID: 'rnacentral', terms: [{ str: 'c'}] },
        { id: 'b', dictID: 'rnacentral', terms: [{ str: 'b'}] },
        { id: 'c', dictID: 'rnacentral', terms: [{ str: 'c'}] },
        { id: 'd', dictID: 'rnacentral', terms: [{ str: 'b'}] },
        { id: 'e', dictID: 'rnacentral', terms: [{ str: 'a'}] }
      ];
      const arrStrSorted = [
        { id: 'e', dictID: 'rnacentral', terms: [{ str: 'a'}] },
        { id: 'b', dictID: 'rnacentral', terms: [{ str: 'b'}] },
        { id: 'd', dictID: 'rnacentral', terms: [{ str: 'b'}] },
        { id: 'a', dictID: 'rnacentral', terms: [{ str: 'c'}] },
        { id: 'c', dictID: 'rnacentral', terms: [{ str: 'c'}] }
      ];

      const options = {};
      dict.sortEntries(arr, options).should.deep.equal(arrIdSorted);
      options.sort = {};
      dict.sortEntries(arr, options).should.deep.equal(arrIdSorted);
      options.sort = '';
      dict.sortEntries(arr, options).should.deep.equal(arrIdSorted);
      options.sort = 'dictID';
      dict.sortEntries(arr, options).should.deep.equal(arrIdSorted);
      options.sort = 'id';
      dict.sortEntries(arr, options).should.deep.equal(arrIdSorted);
      options.sort = 'str';
      dict.sortEntries(arr, options).should.deep.equal(arrStrSorted);

      cb();
    });
  });

  describe('trimEntryObjArray', () => {
    it('properly trims given array of VSM entry objects', cb => {
      const arr = [
        { id:'a', dictID: 'A', terms: [{ str: 'aaa'}] },
        { id:'b', dictID: 'B', terms: [{ str: 'bbb'}] },
        { id:'c', dictID: 'C', terms: [{ str: 'ccc'}] }
      ];

      let options = {};
      dict.trimEntryObjArray(arr, options).should.deep.equal(arr);

      options.page = 2;
      dict.trimEntryObjArray([], options).should.deep.equal([]);

      options.page = -1;
      options.perPage = 'no';
      dict.trimEntryObjArray(arr, options).should.deep.equal(arr);

      options.page = 1;
      options.perPage = 2;
      dict.trimEntryObjArray(arr, options).should.deep.equal(arr.slice(0,2));

      options.page = 2;
      dict.trimEntryObjArray(arr, options).should.deep.equal(arr.slice(2,3));

      options.page = 3;
      dict.trimEntryObjArray(arr, options).should.deep.equal([]);

      cb();
    });
  });

  describe('hasProperEntrySortProperty', () => {
    it('returns true or false whether the `options.sort` property for an ' +
      'entry VSM object is properly defined', cb => {
      const options = {};
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = [];
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = {};
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = '';
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = 45;
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = 'dictID';
      expect(dict.hasProperEntrySortProperty(options)).to.equal(true);
      options.sort = 'id';
      expect(dict.hasProperEntrySortProperty(options)).to.equal(true);
      options.sort = 'str';
      expect(dict.hasProperEntrySortProperty(options)).to.equal(true);
      options.sort = noResultsStr;
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);

      cb();
    });
  });
});
