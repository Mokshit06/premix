const nodemon = require('nodemon');
const express = require('express');
const cors = require('cors');

const app = express();

function createObservable(initialValue) {
  let value = initialValue;
  const listeners = new Set();
  const subscribe = cb => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  };
  const emit = newValue => {
    value = newValue;
    listeners.forEach(listener => listener(newValue));
  };

  return { value, subscribe, emit };
}

const observable = createObservable(null);

nodemon({
  exec: 'node --enable-source-maps .premix/build/server.js',
  watch: ['.premix/build', '.premix/public/build'],
  quiet: true,
})
  .on('start', async files => {
    await new Promise(resolve => setTimeout(resolve, 700));
    observable.emit('Files changed');
  })
  .on('crash', () => {
    process.exit();
  })
  .on('quit', function () {
    process.exit();
  });

app.use(cors({ origin: (origin, cb) => cb(null, true) }));

app.get('/__premix/livereload', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const unsubscribe = observable.subscribe(async value => {
    res.write(`data: ${value}\n\n`);
  });

  res.on('close', () => unsubscribe());
});

app.listen(3456);
