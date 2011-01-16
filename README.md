Check the LICENSE file licensing details.

This is in the early stages of development and could break backwards compatibility at any time.

* You can find me on Twitter: @cocos2djs
* Email: <ryan@cocos2d-javascript.org>
* Website: <http://cocos2d-javascript.org/>
* Documentation: <http://cocos2d-javascript.org/documentation>
* Forum: <http://cocos2d-javascript.org/forum>

Creating a new project
----------------------

To create a new project you first need to get a copy of cocos2d-javascript. Grab the latest using git

    git clone git://github.com/ryanwilliams/cocos2d-javascript.git

To create your initial project simply navigate to the cocos2d-javascript directory and run

    ./cocos new ~/Projects/MyApp

This will create a new directory at that path with everything you need to
get started. It will also add cocos2d-javascript as a git submodule. If you
prefer to just copy the cocos2d-javascript code instead of using a git
submodule then use

    ./cocos new ~/Projects/MyApp -g

Getting things running
----------------------

To get your project running simply navigate to the newly created directory run
the development web server

    ./cocos server

And visit <http://localhost:4000/>. There you will see a simple application
outputting your application name.

Developing
----------

Everything you write will be in separate JavaScript files. These will be
compiled into a single file which also includes all your other resources
including images, sound files, map files, etc.

The entry point for the code is path defined as "main.js" inside the in "make.js" file.

In the public/index.html you will see &lt;script src="appname.js"&gt; tag to include the code.

The web server will compile your code each time it is requested. This makes
development a lot easier.

Run ./cocos server -h for help.

Compiling your application
--------------------------

To compile your code you run ./cocos make. Which reads the make.js file
to work out what you want to build.

When built the resulting .js file will contain all your code aswell as all your
images and map files. This means you only need to update a single file and only
a single HTTP request is needed to serve everything.

Run ./cocos make -h for help.

Browser Support
---------------

I intend for this to work in Firefox, Chrome, Safari, Opera and IE9. I
mostly develop using Chrome so that's likely to have the best compatibility
until I get close to a proper release.

Documentation
-------------

Download JsDoc 2.3 (or 2.4) from <http://code.google.com/p/jsdoc-toolkit/>.

Copy that to /usr/local/jsdoc-toolkit or wherever you like and then run:
    
    JSDOC_HOME=/usr/local/jsdoc-toolkit ./jsdoc

The documentation will appear in the 'docs' directory.

© 2010 Ryan Williams <ryan@cocos2d-javascript.org>

