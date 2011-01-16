#!/usr/bin/env python

from optparse import OptionParser
import subprocess
import sys, re, os, base64, mimetypes, codecs, shutil

INDEX_TEMPLATE = '''
<!doctype html> 
<html> 
    <head> 
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"> 
        <script src="{script_name}" type="text/javascript"></script> 
        <title>{project_name}</title> 
        <style type="text/css" media="screen"> 
            body {{
                font-family: Helvetica, Arial, sans-serif;
                font-size: 10pt;
            }}
            #cocos2d-app {{
                border: 1px solid #000;
                width: 480px;
                height: 320px;
                margin: 0 20px;
            }}
        </style> 
    </head> 
    <body> 
        <h1>{project_name}</h1> 
       <div id="cocos2d-app"></div> 
    </body> 
</html> 
'''

MAKE_JS_TEMPLATE = '''
{{
    "output":     "public/{script_name}",
    "extensions": ["js", "gif", "jpeg", "jpg", "png", "tmx", "tsx", "plist"],
    "main_module": "main",

    "paths": {{
        "cocos2d/src" : "/",
        "src" : "/"
    }}
}}
'''

MAIN_JS_TEMPLATE = '''
// Import the cocos2d module
var cocos = require('cocos2d'),
// Import the geometry module
    geo = require('geometry');

// Create a new layer
var {class_name} = cocos.nodes.Layer.extend({{
    init: function() {{
        // You must always call the super class version of init
        @super;

        // Get size of canvas
        var s = cocos.Director.get('sharedDirector').get('winSize');

        // Create label
        var label = cocos.nodes.Label.create({{string: '{project_name}', fontName: 'Arial', fontSize: 76}});

        // Add label to layer
        this.addChild({{child: label, z:1}});

        // Position the label in the centre of the view
        label.set('position', geo.ccp(s.width / 2, s.height / 2));
    }}
}});

// Initialise everything

// Get director
var director = cocos.Director.get('sharedDirector');

// Attach director to our <div> element
director.attachInView(document.getElementById('cocos2d-app'));

// Create a scene
var scene = cocos.nodes.Scene.create();

// Add our layer to the scene
scene.addChild({{child: {class_name}.create()}});

// Run the scene
director.runWithScene(scene);
'''


def main():
    def removeNonAscii(s):
        return "".join(i for i in s if ord(i) < 128)

    parser = OptionParser(usage="Usage: cocos new APP_PATH")
    parser.add_option("-g", "--no-git", action="store_true", dest="nogit")

    (options, args) = parser.parse_args()

    if not str(args[0]).strip():
        print "Usage: cocos new APP_PATH"
        return 1


    use_git = not options.nogit
    project_path = os.path.abspath(args[0])
    project_name = os.path.basename(project_path)
    script_name = removeNonAscii(project_name.lower().replace(' ', '_')) +'.js'
    class_name = re.sub('(?:^| )(.)', lambda m: m.group(1).upper(), removeNonAscii(project_name.lower()))

    paths = (
        'src',
        'src/resources',
        'public',
    )
    
    # Create initial folders
    print "Creating cocos2d-javascript project in: %s" % project_path
    for p in paths:
        full_path = os.path.join(project_path, p)
        if not os.path.exists(full_path):
            print "Creating new directory : %s" % full_path
            os.makedirs(full_path)

    subs = {'project_name': project_name, 'script_name': script_name, 'class_name': class_name}

    # Write out public/index.html
    index = open(os.path.join(project_path, 'public/index.html'), 'w')
    index.write(INDEX_TEMPLATE.format(**subs))
    index.close()

    # Write out make.js
    make_js = open(os.path.join(project_path, 'make.js'), 'w')
    make_js.write(MAKE_JS_TEMPLATE.format(**subs))
    make_js.close()

    # Write out src/main.js
    main_js = open(os.path.join(project_path, 'src/main.js'), 'w')
    main_js.write(MAIN_JS_TEMPLATE.format(**subs))
    main_js.close()


    # Create cocos2d code
    if use_git:
        print "Creating cocos2d git submodule"
        os.chdir(project_path)
        subprocess.call(['git', 'init'])
        subprocess.call(['git', 'submodule', 'add', 'git://github.com/ryanwilliams/cocos2d-javascript.git', 'cocos2d'])
    else:
        print "Copying cocos2d"
        cocos_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        shutil.copytree(cocos_path, os.path.join(project_path, 'cocos2d'))
        os.chdir(project_path)

    shutil.copy2('cocos2d/cocos', './cocos')
    shutil.copy2('cocos2d/cocos.bat', './cocos.bat')


    

if __name__ == "__main__":
    main()
