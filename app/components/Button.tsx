import { ButtonHTMLAttributes } from 'react';
import { buttonStyles } from '../styles/button.css';

export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={buttonStyles} />;
}
