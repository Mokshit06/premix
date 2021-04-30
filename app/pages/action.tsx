import { useEffect } from 'react';
import styles from 'url:../styles/action.css';
import { Form, usePendingFormSubmit, useRouteData } from '../../src';
import Link from '../../src/link';
import type {
  ActionFunction,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from '../../src/types';
import Button from '../components/Button';
import { prisma } from '../lib/prisma.server';

export const meta: MetaFunction = () => {
  return {
    title: 'Action',
  };
};

export const links: LinksFunction = () => {
  return [
    {
      rel: 'stylesheet',
      href: styles,
    },
  ];
};

export const loader: LoaderFunction = async () => {
  const allUsers = await prisma.user.findMany();

  return {
    props: { allUsers },
  };
};

export const action: ActionFunction = async (req, res) => {
  const { name, email } = req.body;

  await new Promise(resolve => setTimeout(resolve, 600));

  await prisma.user.create({
    data: {
      name,
      email,
    },
  });

  res.redirect('/action');
};

export default function Home() {
  const [{ allUsers }] = useRouteData();
  const pendingForm = usePendingFormSubmit();

  return (
    <div>
      <Link href="/">Home</Link>
      <pre>{JSON.stringify(allUsers, null, 2)}</pre>
      {pendingForm && <h1>Creating new user: {pendingForm.get('name')}</h1>}
      <Form action="/action">
        <label>
          Name:
          <input name="name" />
        </label>
        <label>
          Email:
          <input name="email" type="email" />
        </label>
        <Button type="submit">Submit</Button>
      </Form>
    </div>
  );
}
