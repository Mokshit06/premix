import { Todo } from '@prisma/client';
import { useEffect, useRef } from 'react';
import { Form, usePendingFormSubmit, useRouteData, useSubmit } from 'src';
import { Link } from '@premix/core/router';
import type {
  ActionFunction,
  ServerLoaderFunction,
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

export const serverLoader: ServerLoaderFunction = async req => {
  const todos = await prisma.todo.findMany();
  const [message] = req.flash('message');
  const errors = req.flash('error');

  return {
    props: { todos, message, errors },
  };
};

export const action: ActionFunction = async (req, res) => {
  switch (req.method) {
    case 'POST': {
      if (!req.body.text) {
        req.flash('error', 'Text required!');
        return res.redirect(303, '/todos');
      }
      await prisma.todo.create({
        data: {
          text: req.body.text,
        },
      });
      req.flash('message', 'Created Todo');
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
      req.flash('message', 'Updated Todo');
      break;
    }
  }

  res.redirect(303, '/todos');
};

export default function ActionPage() {
  const { todos, message, errors } = useRouteData<{
    todos: Todo[];
    message: string;
    errors: string[];
  }>();
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
      {message && (
        <div
          style={{
            padding: '10px 15px',
            backgroundColor: 'green',
            color: 'white',
          }}
        >
          <h1>{message}</h1>
        </div>
      )}
      {errors.map(err => (
        <div
          key={err}
          style={{
            padding: '10px 15px',
            backgroundColor: 'orange',
            color: 'white',
          }}
        >
          <h1>{err}</h1>
        </div>
      ))}
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
