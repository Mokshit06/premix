import { createRequestHandler } from '@premix/core/server';
import chalk from 'chalk';
import express from 'express';

const app = express();

app.use('/', createRequestHandler());

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(chalk.green`Server started on http://localhost:${port}`);
});
