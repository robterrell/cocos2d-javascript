function resource(path) {
    return window.__resources__[path].data;
}

(function() {
    var process = {};
    var modulePaths = ['/', '/libs'];

    var path; // Will be loaded further down

    function resolveModulePath(request, parent) {
        // If not a relative path then search the modulePaths for it
        var start = request.substring(0, 2);
        if (start !== "./" && start !== "..") {
            return modulePaths;
        }

        var parentIsIndex = path.basename(parent.filename).match(/^index\.js$/),
            parentPath    = parentIsIndex ? parent.id : path.dirname(parent.id);

        // Relative path so searching inside parent's directory
        return [path.dirname(parent.filename)];
    }

    function findModulePath(id, dirs) {
        if (id.charAt(0) === '/') {
            dirs = [''];
        }
        for (var i = 0; i < dirs.length; i++) {
            var dir = dirs[i];
            var p = path.join(dir, id);

            // Check for index first
            if (path.exists(path.join(p, 'index.js'))) {
                return path.join(p, 'index.js');
            } else if (path.exists(p + '.js')) {
                return p + '.js';
            }
        }

        return false;
    }

    function loadModule(request, parent) {
        parent = parent || process.mainModule;

        var paths    = resolveModulePath(request, parent),
            filename = findModulePath(request, paths);

        if (filename === false) {
            throw "Unable to find module: " + request;
        }


        if (parent) {
            var cachedModule = parent.moduleCache[filename];
            if (cachedModule) {
                return cachedModule;
            }
        }

        //console.log('Loading module: ', filename);

        var module = new Module(filename, parent);
        module._initialize(filename);

        return module;
    }

    function Module(id, parent) {
        this.id = id;
        this.parent = parent;
        this.children = [];
        this.exports = {};

        if (parent) {
            this.moduleCache = parent.moduleCache;
            parent.children.push(this);
        } else {
            this.moduleCache = {};
        }
        this.moduleCache[this.id] = this;

        this.filename = null;
        this.dirname = null;
    }

    Module.prototype._initialize = function(filename) {
        var module = this;
        function require(request) {
            return loadModule(request, module).exports;
        }

        this.filename = filename;

        // Work around incase this IS the path module
        if (path) {
            this.dirname = path.dirname(filename);
        } else {
            this.dirname = '';
        }

        require.paths = modulePaths;
        require.main = process.mainModule;

        window.__resources__[this.filename].data.apply(this.exports, [this.exports, require, this, this.filename, this.dirname])

        return this;
    }

    // Manually load the path module because we need it to load other modules
    path = (new Module('path'))._initialize('/path.js').exports;


    // Populate globals
    var globals = loadModule('global').exports;
    for (var x in globals) {
        window[x] = globals[x];
    }

    var util = loadModule('util').exports;
    util.ready(function() {
        process.mainModule = loadModule(__main_module_name__);
    });

    // Add a global require. Useful in the debug console.
    window.require = function require(request, parent) {
        return loadModule(request, parent).exports;
    }
    window.require.paths = modulePaths;
    window.require.main = process.mainModule;
})();
