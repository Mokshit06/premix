import styles from 'url:../styles/action.css';
import { Form, usePendingFormSubmit, useRouteData } from '../../src';
import type {
  ActionFunction,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from '../../src/types';

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
  const { prisma } = await import('../lib/prisma');
  const allUsers = await prisma.user.findMany();

  return {
    props: { allUsers },
  };
};

export const action: ActionFunction = async (req, res) => {
  const { prisma } = await import('../lib/prisma');
  const { name, email } = req.body;

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
      <pre>{JSON.stringify(allUsers, null, 2)}</pre>
      {pendingForm ? (
        <h1>Creating new user: {pendingForm.name}</h1>
      ) : (
        <Form action="/action">
          <label>
            Name:
            <input name="name" />
          </label>
          <label>
            Email:
            <input name="email" type="email" />
          </label>
          <button type="submit">Submit</button>
        </Form>
      )}
    </div>
  );
}
