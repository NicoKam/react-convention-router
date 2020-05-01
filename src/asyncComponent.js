import React from "react";

export default function (getComponent) {
  return class AsyncComponent extends React.Component {
    constructor(props) {
      super(props);
      this.state = { Component: null };
    }

    componentDidMount() {
      const { Component } = this.state;

      if (!Component) {
        getComponent().then(({ default: Comp }) => {
          this.setState({ Component: Comp });
        });
      }
    }

    render() {
      const { Component } = this.state;
      if (Component) {
        return <Component {...this.props} />;
      }
      return null;
    }
  };
}
