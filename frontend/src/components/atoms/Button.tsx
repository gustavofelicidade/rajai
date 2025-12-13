import React from 'react'

type ButtonProps = {
  children: React.ReactNode
  variant?: 'primary' | 'ghost'
  href?: string
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  href,
  className = '',
  ...rest
}) => {
  const classes = `button button--${variant} ${className}`.trim()

  if (href) {
    const anchorProps = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>
    return (
      <a className={classes} href={href} {...anchorProps}>
        {children}
      </a>
    )
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}

export default Button
