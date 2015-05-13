var srcPath = __dirname + '/src';
var distPath = __dirname + '/dist';
var path = require('path');
var fs = require('fs');
var execSync = require('child_process').execSync;
execSync('mkdir -p dist', {
    cwd: __dirname
});

execSync('rm -rf dist/!*', {
    cwd: __dirname
});

var babel = require('babel');

fs.readdirSync(srcPath).forEach(function (filename) {
    "use strict";
    if (path.extname(filename) === '.js') {
        var filePath = path.join(srcPath, filename);
        var destFilePath = path.join(distPath, filename);
        babel.transformFile(path.join(srcPath, filename),{
            modules:'umd'
        }, function (err, result) {
            // => { code, map, ast }
            fs.writeFileSync(destFilePath, result.code, {
                encoding: 'utf8'
            });
        });
    }
});

