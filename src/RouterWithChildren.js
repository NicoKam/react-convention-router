import React from 'react';
import { Route, Router, Switch } from 'react-router';

const RevRoutes = ({ routes = [] }) => {
  return (
    <Switch>
      {routes.map(({ children, path, component = null, exact, indexRoute, ...props }) => {
        const Page = component;
        const childrenComp = <RevRoutes routes={children} />;
        return (
          <Route
            key={path}
            path={path}
            exact={exact}
            render={(childProps) => {
              if (component) {
                return <Page {...childProps}>{childrenComp}</Page>;
              } else {
                return childrenComp;
              }
            }}
            {...props}
          />
        );
      })}
    </Switch>
  );
};

const RouterWithChildren = ({ routes = [], ...props }) => {
  return (
    <Router {...props}>
      <RevRoutes routes={routes} />
    </Router>
  );
};

export default RouterWithChildren;
