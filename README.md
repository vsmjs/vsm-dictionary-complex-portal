# vsm-dictionary-complex-portal

<!-- badges: start -->
[![Travis build status](https://travis-ci.org/vsmjs/vsm-dictionary-complex-portal.svg?branch=master)](https://travis-ci.org/vsmjs/vsm-dictionary-complex-portal)
[![npm version](https://img.shields.io/npm/v/vsm-dictionary-complex-portal)](https://www.npmjs.com/package/vsm-dictionary-complex-portal)
[![Downloads](https://img.shields.io/npm/dm/vsm-dictionary-complex-portal)](https://www.npmjs.com/package/vsm-dictionary-complex-portal)
<!-- badges: end -->

## Summary

`vsm-dictionary-complex-portal` is an implementation 
of the 'VsmDictionary' parent-class/interface (from the package
[`vsm-dictionary`](https://github.com/vsmjs/vsm-dictionary)), that uses 
the [EBI Search RESTful Web Services](https://www.ebi.ac.uk/ebisearch/apidoc.ebi) 
to interact with the [Complex Portal database](https://www.ebi.ac.uk/complexportal/home) 
and translate the provided manually curated macromolecular complexes information 
into a VSM-specific format.

## Example use

Create a `test.js` file and include this code:

```javascript
const DictionaryComplexPortal = require('./DictionaryComplexPortal');
const dict = new DictionaryComplexPortal({log: true});

dict.getEntryMatchesForString('tp53', { page: 1, perPage: 5 }, 
  (err, res) => {
    if (err) 
      console.log(JSON.stringify(err, null, 4));
    else
      console.log(JSON.stringify(res, null, 4));
  }
);
```
Then, run `node test.js`

## Tests

Run `npm test`, which runs the source code tests with Mocha.  
If you want to quickly live test the EBI Search API, go to the 
`test` directory and run:
```
node getEntries.test.js
node getEntryMatchesForString.test.js
```

## 'Build' configuration

To use a VsmDictionary in Node.js, one can simply run `npm install` and then
use `require()`. But it is also convenient to have a version of the code that
can just be loaded via a &lt;script&gt;-tag in the browser.

Therefore, we included `webpack.config.js`, which is a Webpack configuration file for 
generating such a browser-ready package.

By running `npm build`, the built file will appear in a 'dist' sub-folder. 
You can use it by including: 
`<script src="../dist/vsm-dictionary-complex-portal.min.js"></script>` in the
header of an HTML file.

## Specification

Like all VsmDictionary subclass implementations, this package follows
the parent class
[specification](https://github.com/vsmjs/vsm-dictionary/blob/master/Dictionary.spec.md).
In the next sections we will explain the mapping between the data 
offered by EBI Search's API and the corresponding VSM objects. Find the 
documentation for the API here: https://www.ebi.ac.uk/ebisearch/documentation.ebi

Note that if we receive an error response from the EBI Search servers (see the 
URL requests for `getEnties` and `getEntryMatchesForString` below) that is not a
JSON string that we can parse, we formulate the error as a JSON object ourselves 
in the following format:
```
{
  status: <number>,
  error: <response> 
}
```
where the *response* from the server is JSON stringified.

### Map Complex Portal to DictInfo VSM object

This specification relates to the function:  
 `getDictInfos(options, cb)`

If the `options.filter.id` is not properly defined 
or the `https://www.ebi.ac.uk/complexportal` dictID is included in the 
list of ids used for filtering, `getDictInfos` returns a static object 
with the following properties:
- `id`: 'https://www.ebi.ac.uk/complexportal' (will be used as a `dictID`)
- `abbrev`: 'Complex Portal'
- `name`: 'Complex Portal'

Otherwise, an empty result is returned.

### Map Complex Portal to Entry VSM object

This specification relates to the function:  
 `getEntries(options, cb)`

Firstly, if the `options.filter.dictID` is properly defined and in the list of 
dictIDs the `https://www.ebi.ac.uk/complexportal` dictID is not included, then 
an **empty array** of entry objects is returned.

If the `options.filter.id` is properly defined (with IDs like
`https://www.ebi.ac.uk/complexportal/complex/CPX-200`) then we use a query like this:

```
https://www.ebi.ac.uk/ebisearch/ws/rest/complex-portal/entry/CPX-200,CPX-20,CPX-2000?fields=id%2Cname%2Cdescription%2Ccomplex_systematic_name%2Ccomplex_synonym%2Corganism&format=json
```

For the above URL, we provide a brief description for each sub-part: 
- The first part refers to the EBI Search's main REST endpoint: https://www.ebi.ac.uk/ebisearch/ws/rest/
- The second part refers to the **domain** of search (*complex-portal*)
- The third part refers to the *entry* endpoint (which allows us to request 
for entry information associated with entry identifiers)
- The fourth part is the *entry IDs*, comma separated (we extract the last part 
of the Complex Portal-specific URI for each ID). Note that for VSM the URI ID is 
something like: `https://www.ebi.ac.uk/complexportal/complex/CPX-200`, while 
the Complex Portal entry IDs are created in the form: `CPX-[0-9]+`. 
- The fifth part is the *fields* of interest - i.e. the information related to 
the entries that we will map to VSM-entry properties. For a complete list of the 
available fields for the complex-portal domain, see: https://www.ebi.ac.uk/ebisearch/metadata.ebi?db=complex-portal
- The last part defines the format of the returned data (JSON)

Otherwise, we ask for all ids (by default **id sorted**) with this query:
```
https://www.ebi.ac.uk/ebisearch/ws/rest/complex-portal?query=domain_source:complex-portal&fields=id%2Cname%2Cdescription%2Ccomplex_systematic_name%2Ccomplex_synonym%2Corganism&sort=id&size=50&start=0&format=json
```

Note that depending on the `options.page` and `options.perPage` options 
we adjust the `size` and `start` parameters accordingly. The `size` requested 
can be between 0 and 100 and if its not in those limits or not properly defined, 
we set it to the default page size which is **50**. The `start` (offset, zero-based)
can be between 0 and 1000000. The default value for `start` is 0 (if `options.page`
is not properly defined) and if the *(page size) \* (#page requested - 1)* exceeds 
1000000, then we set it to `999999`, allowing thus the retrieval of the last 
entry (EBI Search does not allow us to retrieve more than the 1000000th entry 
of a domain).

Only when requesting for specific IDs, we sort the results depending on the
`options.sort` value: results can be either `id`-sorted or `str`-sorted,
according to the specification of the parent 'VsmDictionary' class.
We then prune these results according to the values `options.page` (default: 1)
and `options.perPage` (default: 50).

When using the EBI search API, we get back a JSON object with an *entries* 
property, which has as a value an array of objects (the entries). Every entry
object has a *fields* property whose value is an object with properties all 
the fields that we defined in the initial query. We now provide a mapping of 
these fields to VSM-entry specific properties:

Complex Portal field | Type | Required | VSM entry/match object property | Notes  
:---:|:---:|:---:|:---:|:---:
`id` | Array | YES | `id` | The VSM entry id is the full URI
`name` | Array | NO | `str`,`terms[0].str` | We use the first element only. If empty, we try taking the first element from `complex_systematic_name`
`description` | Array | NO | `descr` | We use the first element only
`complex_systematic_name` | Array | NO | `str`,`terms[i].str` | We use the first element only
`complex_synonym` | Array | NO | `terms[i].str` | We map the whole array
`organism` | Array | NO | `z.species` | We use the first element only

Note that the above mapping describes what we as developers thought as the most
reasonable. There is though a global option `optimap` that you can pass to the 
`DictionaryComplexPortal` object, which optimizes the above mapping for curator clarity
and use. The **default value is true** and what changes in the mapping table
above (which is the mapping for `optimap: false` actually) is that the VSM's `descr` 
entry/match object property takes the combined value of the `id`, the species
name (`organism`) and the `description` (in that order). 
The reason behind this is that we wanted to make `description` a little more 
clear by providing the Complex Portal ID and the species so that the curator 
will know exactly which complex we are referring to.

### Map Complex Portal to Match VSM object

This specification relates to the function:  
 `getEntryMatchesForString(str, options, cb)`

Firstly, if the `options.filter.dictID` is properly defined and in the list of 
dictIDs the `https://www.ebi.ac.uk/complexportal` dictID is not included, then 
an **empty array** of match objects is returned.

Otherwise, an example of a URL string that is being built and send to the EBI 
Search's REST API when requesting for `tp53`, is:
```
https://www.ebi.ac.uk/ebisearch/ws/rest/complex-portal?query=tp53&fields=id%2Cname%2Cdescription%2Ccomplex_systematic_name%2Ccomplex_synonym%2Corganism&size=20&start=0&format=json
```

The fields requested are the same as in the `getEntries(options, cb)` 
case as well as the mapping shown in the table above. Also for the `size` and 
`start` parameters the same things apply as in the `getEntries` specification.
 
No sorting whatsoever is done on the server or client side.
