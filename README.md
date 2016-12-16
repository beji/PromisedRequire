# PromisedRequire
A simple promise-based module loader, roughly following the http://requirejs.org/ syntax

##Howto:
Insert the promise js script like this
```html
<script type="text/javascript" src="/promise.js" entrypoint="entry"></script>
```
at the end of the body. The entrypoint attribute in this example points to the file "/entry.js", the filename is defined by the attribute value. You can also provide a path if needed.
The entry.js file might look like this
```js
define(['a', 'c'], function(a,c){
    console.log(a);
    console.log(c.dostuff(1));
});
```
This defines a module that requires the modules "a" and "b" to be loaded and then executes.
