const fs = require('fs');
const path = require('path');

const source = path.resolve(__dirname, '..', 'README.md');
const dest = path.resolve(__dirname, '..', 'client/static', 'docs.md');

function copyFile(source, target, cb) {
  let cbCalled = false;

  const rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  const wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

copyFile(source, dest, function (err) {
  if (err) {
    return console.error(err);
  }
  console.log('Copied:', source, dest);
});
