import express from 'express';
import { createRequestHandler } from '@premix/core/server';
import compression from 'compression';
import chalk from 'chalk';

const app = express();

app.use(compression());

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', createRequestHandler());

app.listen(3000, () => {
  console.log(chalk.green`Server started on http://localhost:3000`);
});
