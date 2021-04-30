# Premix

Premix is an open source alternative to [Remix](https://remix.run/) with the same modern API.

### Features

- Server Side Rendering
- Meta tags for better SEO
- Data Fetching
- Data Mutation
- Optimistic UI
- Small bundles
- Dynamic routing
- Live reloading (both server and client)
- Code splitting on per page basis
- Ability to write server code in the same file as your components

## Getting Started

Currently there is no CLI for Premix, so you need to clone this repository.

- Once cloned, you will see an `app` folder. This is where you 99% write all of your code.
- To create a new page, create a file inside `app/pages` directory and add an import along with the path to `app/routes.ts`.
- From this page, you need to default export a React component that will be rendered on this route.
- To fetch data, you can optionally export a function named loader from the same file.
- To mutate data, you can optionally export a function named action from the same file.

## Example

```js
import { Form, usePendingFormSubmit, useRouteData } from '../../src';
import db from '../fake-db';

export async function loader() {
  const todos = await db.todos.findMany();
  return {
    props: { todos },
  };
}

export async function action(req, res) {
  const { text } = req.body;

  const todo = await db.todos.create({
    data: { text, complete: false },
  });

  res.redirect('/todos');
}

export default function Todos() {
  const [{ todos }] = useRouteData();
  const pendingFormSubmit = usePendingFormSubmit();

  return (
    <>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input type="checkbox" checked={todo.complete} />
            <span>{todo.text}</span>
          </li>
        ))}
        {pendingFormSubmit && (
          <li>
            <input type="checkbox" disabled />
            <span>{pendingFormSubmit.get('text')}</span>
          </li>
        )}
      </ul>
      <Form action="/todos">
        <input name="text" type="text" placeholder="New Todo" />
        <button>Create</button>
      </Form>
    </>
  );
}
```
