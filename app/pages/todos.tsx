import { Todo } from '@prisma/client';
import { useEffect, useRef } from 'react';
import { Form, usePendingFormSubmit, useRouteData, useSubmit } from 'src';
import { Link } from '@premix/core/router';
import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from '@premix/core/types';
import Button from '../components/Button';
import { prisma } from '../lib/prisma';
import '../styles/action.css';
import '../styles/style.css';

export const meta: MetaFunction = () => {
  return {
    title: 'Todos',
  };
};

export const loader: LoaderFunction = async () => {
  const todos = await prisma.todo.findMany();

  return {
    props: { todos },
  };
};

export const action: ActionFunction = async (req, res) => {
  switch (req.method) {
    case 'POST': {
      await prisma.todo.create({
        data: {
          text: req.body.text,
        },
      });
      break;
    }
    case 'PUT': {
      await prisma.todo.update({
        where: {
          id: Number(req.body.id),
        },
        data: {
          complete: JSON.parse(req.body.complete),
        },
      });
      break;
    }
  }

  res.redirect(303, '/todos');
};

export default function ActionPage() {
  const { todos } = useRouteData<{ todos: Todo[] }>();
  const pendingFormSubmit = usePendingFormSubmit();
  const formRef = useRef<HTMLFormElement>();
  const submit = useSubmit();

  useEffect(() => {
    if (pendingFormSubmit) {
      formRef.current.reset();
    }
  }, [pendingFormSubmit]);

  return (
    <main>
      <Link href="/">Home</Link>
      <h2>Todos</h2>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.complete}
              onChange={e => {
                submit(
                  {
                    id: todo.id,
                    complete: e.target.checked,
                  },
                  {
                    replace: true,
                    method: 'put',
                  }
                );
              }}
            />
            {todo.text}
          </li>
        ))}
        {pendingFormSubmit && (
          <li>
            <input type="checkbox" disabled />
            {pendingFormSubmit.data.get('text')}
          </li>
        )}
      </ul>
      <Form ref={formRef} action="/todos">
        <label>
          Todo:
          <input name="text" type="text" />
        </label>
        <Button type="submit">Create</Button>
      </Form>
    </main>
  );
}
