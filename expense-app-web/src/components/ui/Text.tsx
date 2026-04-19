import React, { JSX } from 'react'

type Props = {
    as?: keyof JSX.IntrinsicElements;
    variant?: 'title' | 'subtitle' | 'body' | 'caption';
    weight?: 'normal' | 'medium' | 'semibold' | 'bold'; 
    children: React.ReactNode;
    className?: string;
}
const variantStyles = {
  title: 'text-2xl sm:text-3xl tracking-tight',
  subtitle: 'text-sm mt-0.5 hidden sm:block',
  body: 'text-sm',
  caption: 'text-xs',
};


const weightStyles = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

function Text({as: Component = 'p', variant = 'body', weight = 'normal', children, className}: Props) {
  return (
    <Component className={`${variantStyles[variant]} ${weightStyles[weight]} ${className}`}>
        {children}
    </Component>
  )
}


export default Text

export const PageTitle = (props: Props) => (
  <Text as="h1" variant="title" weight="bold" {...props} />
);

export const PageSubtitle = (props: Props) => (
  <Text variant="subtitle" className="text-muted" {...props} />
);