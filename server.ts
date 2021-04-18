import express from 'express';
import { createRequestHandler } from './src/server';

const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('*', createRequestHandler());

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
