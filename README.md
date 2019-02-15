# io-serve

npx-compatible REST API for simple file i/o over HTTP.

Run `npx io-serve` inside any directory -- now you have a server running at `http://localhost:33333`.

| Verb | Action
| ------ | -------------
| GET | Returns the corresponding file descending from the current working directory
| HEAD | Same as GET, but returns no file data, only headers and status code.
| PUT | Write the request body to the corresponding file. Directories are automatically created.
| PATCH | Append the request body to the corresponding file. Directories are automatically created.
| DELETE | Delete the corresponding file or directory.
| POST | Unimplemented.

If you GET a directory, you will receive a JSON array of the files and directories inside. Directory names in the listing are appended with a `/`.\
You can distinguish files from directories with the `X-Resource-Type` header which is either `file` or `directory`.

If you GET a path that doesn't exist, the status code will be `404`. If you GET something that isn't a file or directory (like a socket) the status code will be `415`.

If you PATCH or PUT to a directory, the directory will be deleted and a new file will be created in its place.

For environments that do not support the preceding methods, you can instead send a POST request specifying the `X-HTTP-Method-Override` header set to the uppercase method name you wish to override.

## Options

```
Usage: io-serve [options]

Options:
  --bind, -b     The network address to bind upon                       [string]
  --port, -p     Port to start server on               [number] [default: 33333]
  -v, --version  show version information                              [boolean]
  -h, --help     show help                                             [boolean]
```

## Why?

Some embedded environments allow access to HTTP requests but not the filesystem. io-serve bridges that gap.

## Be safe
By default, io-serve only binds to `localhost`, which will prevent outside connections. While it is possible to bind on external addresses with the `-b` option, it should only be done with great care.
