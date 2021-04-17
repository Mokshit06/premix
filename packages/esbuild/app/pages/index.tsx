import { LinksFunction, MetaFunction } from '../types';
import styles from 'url:../style.css';

export const meta: MetaFunction = () => {
  return {
    title: 'My Title',
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

export default function Home(props) {
  return (
    <>
      <h1>Hello {props.hello}</h1>
      <button onClick={() => console.log('Workd')}>Click me</button>
    </>
  );
}
