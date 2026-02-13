import * as React from "react";

function Card({ className, children, ...props }) {
  return (
    <div
      className={className} {...props} >
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...props }) {
  return (
    <div
      data-slot="card-header"
              className={className} {...props} >
      {children}
    </div>
  );  
}

function CardTitle({ className, children, ...props }) {
  return (
    <h3
      data-slot="card-title"
      className={className} {...props} >
      {children}
    </h3>
  );
}

function CardDescription({ className, children, ...props }) {
  return (
    <p
        className={className} {...props} >
      {children}
    </p>
  );
}

function CardAction({ className, children,  ...props }) {
  return (
    <div
      className={className} {...props} >
      {children}
    </div>
  );
}

function CardContent({ className, children, ...props }) {
  return (
    <div
      className={className} {...props} >
      {children}
    </div>
  );
}

function CardFooter({ className, children, ...props }) {
  return (
    <div
      data-slot="card-footer"
      className={className} {...props} >
      {children}
    </div>
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};

