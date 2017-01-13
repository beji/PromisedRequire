(function (global) {
    //this object stores already loaded files so that they don't have to be loaded multiple times
    var pcache = {};
    //The field is silly on purpose
    var iamloading = { loadingsohardlikeomg: true };
    var namefield = 'script-name';

    function getScript(dep) {
        var promise = new Promise(function (resolve, reject) {
            //convert the dependency name to a useful path
            var filepath = (dep.indexOf('/') !== 0 && dep.indexOf('//') !== 0 ? '/' : '') + dep + (dep.indexOf('.js') === -1 ? '.js' : '');
            var script = global.document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.onload = function () {
                resolve(dep);
            };
            script.onerror = function (e) {
                reject(e);
            };
            script.src = filepath;
            //Store the module name on the script tag for later reference
            script.setAttribute(namefield, dep);
            global.document.getElementsByTagName('head')[0].appendChild(script);
        });
        return promise;
    }

    function tryResolve(dep) {
        var tries = 0; maxTries = 10;
        var promise = new Promise(function (resolve, reject) {
            if (pcache[dep] === iamloading) {
                //The code seems to be loaded by another file but isn't done yet, just wait a bit and try again
                var interval = setInterval(function () {
                    if (tries >= maxTries) {
                        //No more tries to go
                        clearInterval(interval);
                        reject('failed to load ' + dep);
                    }
                    else if (pcache[dep] !== iamloading) {
                        //The dependency is loaded
                        clearInterval(interval);
                        resolve(pcache[dep]);
                    }
                    else {
                        //Wait a bit more
                        ++tries;
                    }
                }, 100);
            }
            else {
                resolve(pcache[dep]);
            }
        });
        return promise;
    }

    function define(...args) {
        //currentScript seems to be broken by setTimeout, mabye there is a better way to handle this
        var currentScript = document.currentScript;
        //There might not be a dependency array, in that case we can just execute the function and move on
        if (args.length === 1) {
            var callback = args[0];
            var promise = new Promise(function (resolve, reject) {
                var result = callback();
                if (currentScript !== null && typeof currentScript !== 'undefined') {
                    //Might be null but that is ok
                    pcache[currentScript.getAttribute(namefield)] = result;
                }
                resolve(result);
            });
            return promise;
        }
        else {
            //If there are dependencies they need to be resolved
            var deps = args[0]; //Might be an empty array but that doesn't really matter
            var cb = args[1];
            //Convert all dependency strings into a promise that might eventually contain the desired code
            var promises = deps.map(function (dep) {
                if (typeof pcache[dep] !== 'undefined') {
                    return tryResolve(dep);
                }
                else {
                    //The dependency needs to be loaded, mark it accordingly and load it
                    pcache[dep] = iamloading;
                    return getScript(dep)
                        .then(function (name) {
                            return tryResolve(name);
                        });
                }
            });
            //Get all dependencies for the current file, then execute the function
            //Due to the nature of promises this bubbles up nicely and magically handles recursion and nested dependencies
            return Promise.all(promises).then(function (results) {
                //Apply allows to pass paramters as an array and have them be split up when actually running the callback to properly name them
                return cb.apply(this, results);
            })
                .then(function (result) {
                    if (currentScript !== null && typeof currentScript !== 'undefined') {
                        //Might be null but that is ok
                        pcache[currentScript.getAttribute(namefield)] = result;
                    }
                })
                .catch(function (e) {
                    console.error(e);
                });
        }
    }
    global.define = define;
    //Kick off the entry point
    getScript(document.currentScript.getAttribute('entrypoint'));
} (window))
