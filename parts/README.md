# Notes about this directory

## Why its here

We wanted a way to not clutter the index.html page with hundreds of lines of code and to split it up into sections - but not have the user load a whole new page each time they click a link. So we decided on putting some html code in other files and to dynamically retrieve them when necessary.

## Why its not in the api

Technically we retrieve these html pages via ajax requests akin to the api. Although, these pages are static and don't interact with any "user" data saved and don't depend on any information sent to them. In addition, the api returns JSON data - while these files return html which is directly injected by the client rather than parsed & dealt with.

## Why the .htm extension and not .html

Because our EOL 20-30 year old server at Stony Brook University does some weird stuff with caching .html pages. It's global to the whole server - and we can't modify it with our own .htaccess doc in this directory. Although, .htm pages are not hard-cached like the .html pages - hence why these are .htm

### But since its static data (not dynamic), why does it matter

I don't remember the original reason as it was so long ago. Maybe we/I had the intention of making these pages template files... Hence - they'd somewhat be dynamic...
