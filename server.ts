import express from 'express';
import { createRequestHandler } from '@premix/core/server';
import compression from 'compression';
import chalk from 'chalk';
import morgan from 'morgan';

const app = express();

app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(
    morgan('dev', {
      skip(req, res) {
        return req.url.startsWith('/build/');
      },
    })
  );
}

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', createRequestHandler());

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(chalk.green`Server started on http://localhost:${port}`);
});
