# medusa :snake::statue_of_liberty:

## Installation 

```
npm install -g medusa
```

to install.

## Use

```
Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -n                     Use a non-WP REST API base
    -f                     Force complete rebuild
    -t, --types [types]    Types to be scraped.
    -p, --params [params]  URL params.
    -o, --output <output>  Output location (should be name of a json file)
```

You must also specify a base URL to use. A sample call might look like:

```
medusa http://sample.dev -t posts -p order=asc -p orderby=title -o dump.json
```

This will output a JSON dump of the data named dump.json in your current working directory.

## On the radar/caveats

* This is very much intended to be used with structure of the WordPress REST API, but can ~~probably~~ be repurposed for other APIs that use a `?page=` param for pagination. You'll likely need to update some things anyway.
* Right now, types all have to be specified manually
