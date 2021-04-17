import { LinksFunction, MetaFunction } from '../types';
import styles from 'url:../style.css';

export const meta: MetaFunction = () => {
  return {
    title: 'About',
    description: 'Description',
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

export default function About() {
  return <>About</>;
}
