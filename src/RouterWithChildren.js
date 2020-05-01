import React from "react";
import { Route } from "react-router";
import { Router } from "react-router-dom";

const RevRotues = ({ routes = [] }) => {
  return routes.map(({ children, path, component = null, exact, indexRoute, ...props }) => {
    const Page = component;
    const childrenComp = <RouterWithChildren routes={children} />;
    return (
      <Route
        key={path}
        path={path}
        exact={exact}
        render={(childProps) => {
          if (component) {
            return (
              <Page {...childProps}>
                {
                  childrenComp
                }
              </Page>
            );
          } else {
            return childrenComp;
          }
        }}
        {...props}
      />
    );
  });
};

const RouterWithChildren = ({ routes = [], ...props }) => {
  return (
    <Router {...props}>
      <RevRotues rotues={routes} />
    </Router>
  );
};


export default RouterWithChildren;
