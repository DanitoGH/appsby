const fs = require("fs");
const path = require("path");

var fromDir = function (startPath, filter, realStartPath){

    if (!fs.existsSync(startPath)){
        console.log("no dir ",startPath);
        return;
    }

    if (!realStartPath){
        realStartPath = startPath;
    }

    var files = fs.readdirSync(startPath);

    var ttt = [];
    for(var i = 0; i < files.length; i++){
        var filename = path.join(startPath, files[i]);
        var stats = fs.lstatSync(filename);
        var info = {
            path: filename,
            name: path.basename(filename)
        };

        if (stats.isDirectory()) {
            info.type = "folder";
            info.children = fromDir(filename, filter, realStartPath);
            info.relativeLocation = path.relative(realStartPath, path.dirname(filename));
        } else {
            // Assuming it's a file. In real life it could be a symlink or
            // something else!
            info.type = "file";
            info.relativeLocation = path.relative(realStartPath, path.dirname(filename));
        }
        ttt.push(info);
    }

    return ttt;
};

module.exports = fromDir;
