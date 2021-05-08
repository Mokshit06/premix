import nodemon from 'nodemon';
import express from 'express';
import cors from 'cors';
import chalk from 'chalk';

type Callback<T> = (value: T) => void;

function createObservable<TValue>(initialValue: TValue) {
  let value = initialValue;
  const listeners = new Set<Callback<TValue>>();

  const subscribe = (cb: Callback<TValue>) => {
    listeners.add(cb);

    return () => {
      listeners.delete(cb);
    };
  };

  const emit = (newValue: TValue) => {
    value = newValue;
    listeners.forEach(listener => listener(newValue));
  };

  return { value, subscribe, emit };
}

function createApp() {
  const app = express();

  const observable = createObservable('');

  nodemon({
    exec: 'node --enable-source-maps build/server.js',
    watch: ['build', 'public/build'],
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

  return app;
}

export default function startDevServer(port: number = 3456) {
  const app = createApp();

  app.listen(port, () => {
    console.log(chalk.cyan`Dev server started on http://localhost:${port}`);
  });
}
